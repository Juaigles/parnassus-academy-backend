// src/libs/enhancedLogger.js
import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Logger mejorado con contexto estructurado
 */
class EnhancedLogger {
  constructor() {
    this.logger = pino({
      level: env.LOG_LEVEL || 'info',
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      } : undefined,
      
      // Formatters personalizados
      formatters: {
        level: (label) => {
          return { level: label };
        },
        log: (object) => {
          // Agregar timestamp en formato ISO
          return {
            ...object,
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV
          };
        }
      },
      
      // Serializers para objetos especiales
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          headers: this.sanitizeHeaders(req.headers),
          userAgent: req.headers?.['user-agent'],
          ip: req.ip,
          requestId: req.requestId,
          userId: req.user?.id
        }),
        res: (res) => ({
          statusCode: res.statusCode,
          headers: this.sanitizeHeaders(res.getHeaders?.()),
          responseTime: res.responseTime
        }),
        err: pino.stdSerializers.err,
        user: (user) => ({
          id: user?.id,
          email: user?.email,
          roles: user?.roles
        })
      }
    });
    
    // Contexto global
    this.globalContext = {};
  }
  
  /**
   * Sanitizar headers sensibles
   */
  sanitizeHeaders(headers = {}) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  /**
   * Crear logger con contexto específico
   */
  child(context = {}) {
    return this.logger.child({ ...this.globalContext, ...context });
  }
  
  /**
   * Establecer contexto global
   */
  setGlobalContext(context) {
    this.globalContext = { ...this.globalContext, ...context };
  }
  
  /**
   * Logging estructurado por operación
   */
  operation(operationName, context = {}) {
    return {
      start: (message = `${operationName} started`, additionalContext = {}) => {
        this.logger.info({
          operation: operationName,
          phase: 'start',
          ...context,
          ...additionalContext
        }, message);
        
        return Date.now();
      },
      
      success: (startTime, message = `${operationName} completed`, result = {}) => {
        const duration = Date.now() - startTime;
        this.logger.info({
          operation: operationName,
          phase: 'success',
          duration,
          ...context,
          result: this.sanitizeResult(result)
        }, message);
      },
      
      error: (startTime, error, message = `${operationName} failed`, additionalContext = {}) => {
        const duration = startTime ? Date.now() - startTime : undefined;
        this.logger.error({
          operation: operationName,
          phase: 'error',
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            status: error.status
          },
          ...context,
          ...additionalContext
        }, message);
      }
    };
  }
  
  /**
   * Sanitizar resultado para logging
   */
  sanitizeResult(result) {
    if (!result || typeof result !== 'object') return result;
    
    const sanitized = { ...result };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  /**
   * Logging de eventos de negocio
   */
  businessEvent(event, data = {}) {
    this.logger.info({
      type: 'business_event',
      event,
      data: this.sanitizeResult(data),
      timestamp: new Date().toISOString()
    }, `Business event: ${event}`);
  }
  
  /**
   * Logging de métricas de performance
   */
  performance(metric, value, unit = 'ms', context = {}) {
    this.logger.info({
      type: 'performance_metric',
      metric,
      value,
      unit,
      ...context
    }, `Performance metric: ${metric} = ${value}${unit}`);
  }
  
  /**
   * Logging de auditoría
   */
  audit(action, actor, target = null, result = 'success', details = {}) {
    this.logger.info({
      type: 'audit',
      action,
      actor: this.sanitizeResult(actor),
      target: this.sanitizeResult(target),
      result,
      details: this.sanitizeResult(details),
      timestamp: new Date().toISOString()
    }, `Audit: ${actor?.email || actor?.id} ${action} ${target?.id || target}`);
  }
  
  /**
   * Logging de seguridad
   */
  security(event, severity = 'medium', details = {}) {
    this.logger.warn({
      type: 'security_event',
      event,
      severity,
      details: this.sanitizeResult(details),
      timestamp: new Date().toISOString()
    }, `Security event: ${event}`);
  }
  
  // Métodos básicos que delegan al logger interno
  info(obj, msg) { return this.logger.info(obj, msg); }
  warn(obj, msg) { return this.logger.warn(obj, msg); }
  error(obj, msg) { return this.logger.error(obj, msg); }
  debug(obj, msg) { return this.logger.debug(obj, msg); }
  trace(obj, msg) { return this.logger.trace(obj, msg); }
  fatal(obj, msg) { return this.logger.fatal(obj, msg); }
}

// Instancia global
export const enhancedLogger = new EnhancedLogger();

/**
 * Middleware de logging estructurado
 */
export const structuredLoggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Crear logger con contexto del request
  req.logger = enhancedLogger.child({
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Log del request entrante
  req.logger.info({
    type: 'request_start',
    headers: enhancedLogger.sanitizeHeaders(req.headers),
    body: req.method !== 'GET' ? enhancedLogger.sanitizeResult(req.body) : undefined
  }, 'Request started');
  
  // Interceptar respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log de la respuesta
    req.logger.info({
      type: 'request_end',
      statusCode: res.statusCode,
      duration,
      responseSize: Buffer.byteLength(data || '', 'utf8')
    }, 'Request completed');
    
    // Log de evento de negocio si es necesario
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logBusinessEvent(req, res, data);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Detectar y loggear eventos de negocio importantes
 */
function logBusinessEvent(req, res, responseData) {
  const method = req.method;
  const path = req.route?.path || req.path;
  
  // Compra de curso
  if (method === 'POST' && path.includes('/purchases')) {
    enhancedLogger.businessEvent('course_purchased', {
      userId: req.user?.id,
      courseId: req.body?.courseId,
      amount: req.body?.amount
    });
  }
  
  // Registro de usuario
  if (method === 'POST' && path.includes('/register')) {
    enhancedLogger.businessEvent('user_registered', {
      email: req.body?.email,
      roles: req.body?.roles
    });
  }
  
  // Completar lección
  if (method === 'POST' && path.includes('/complete')) {
    enhancedLogger.businessEvent('lesson_completed', {
      userId: req.user?.id,
      lessonId: req.params?.lessonId
    });
  }
  
  // Crear review
  if (method === 'POST' && path.includes('/reviews')) {
    enhancedLogger.businessEvent('review_created', {
      userId: req.user?.id,
      courseId: req.params?.courseId,
      rating: req.body?.rating
    });
  }
}

/**
 * Middleware de auditoría para cambios importantes
 */
export const auditMiddleware = (req, res, next) => {
  // Solo auditar operaciones de escritura
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  const originalSend = res.send;
  res.send = function(data) {
    // Auditar solo operaciones exitosas
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const path = req.route?.path || req.path;
      
      enhancedLogger.audit(
        `${req.method} ${path}`,
        {
          id: req.user?.id,
          email: req.user?.email,
          roles: req.user?.roles,
          ip: req.ip
        },
        {
          id: req.params?.id || req.params?.courseId,
          type: getResourceType(path)
        },
        'success',
        {
          requestId: req.requestId,
          changes: req.method !== 'GET' ? req.body : undefined
        }
      );
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Obtener tipo de recurso desde el path
 */
function getResourceType(path) {
  if (path.includes('/courses')) return 'course';
  if (path.includes('/modules')) return 'module';
  if (path.includes('/lessons')) return 'lesson';
  if (path.includes('/users')) return 'user';
  if (path.includes('/reviews')) return 'review';
  return 'unknown';
}

export default enhancedLogger;
