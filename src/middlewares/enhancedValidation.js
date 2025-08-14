// src/middlewares/enhancedValidation.js
import { ZodError } from 'zod';
import { logger } from '../libs/logger.js';

/**
 * Middleware de validación mejorado con mejor logging y contexto
 */
export const enhancedValidate = (schema) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Preparar datos para validación
      const validationData = {};
      
      if (schema.shape?.body) {
        validationData.body = req.body;
      }
      
      if (schema.shape?.params) {
        validationData.params = req.params;
      }
      
      if (schema.shape?.query) {
        validationData.query = req.query;
      }

      // Validar con el schema
      const validatedData = await schema.parseAsync(validationData);
      
      // Actualizar request con datos validados y sanitizados
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) req.query = validatedData.query;
      
      // Log tiempo de validación si es lento
      const validationTime = Date.now() - startTime;
      if (validationTime > 100) {
        logger.warn({
          validationTime,
          endpoint: req.path,
          method: req.method
        }, 'Slow validation detected');
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear errores de Zod con más contexto
        const formattedErrors = error.errors.map(err => {
          const field = err.path.join('.');
          return {
            field: field || 'root',
            message: err.message,
            code: err.code,
            value: err.received || undefined,
            expected: err.expected || undefined
          };
        });
        
        // Log del error de validación
        logger.warn({
          endpoint: req.path,
          method: req.method,
          userId: req.user?.id,
          errors: formattedErrors,
          body: req.body,
          params: req.params,
          query: req.query
        }, 'Validation failed');
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Los datos enviados no cumplen con el formato requerido',
          details: formattedErrors,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
      
      // Error no relacionado con validación
      logger.error({
        error: error.message,
        stack: error.stack,
        endpoint: req.path,
        method: req.method
      }, 'Validation middleware error');
      
      next(error);
    }
  };
};

/**
 * Middleware para agregar contexto a todos los requests
 */
export const requestContext = (req, res, next) => {
  // Agregar ID único al request para tracking
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Agregar timestamp
  req.timestamp = new Date().toISOString();
  
  // Agregar IP real (considerando proxies)
  req.realIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  // Headers para tracking
  res.set('X-Request-ID', req.requestId);
  
  next();
};

/**
 * Middleware de logging mejorado para requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log del request entrante
  logger.info({
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    ip: req.realIP
  }, 'Request started');
  
  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log de la respuesta
    logger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      responseSize: Buffer.byteLength(data || '', 'utf8')
    }, 'Request completed');
    
    // Log si la request fue lenta
    if (duration > 1000) {
      logger.warn({
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration,
        userId: req.user?.id
      }, 'Slow request detected');
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware para detectar requests maliciosos
 */
export const maliciousRequestDetection = (req, res, next) => {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    // Path traversal
    /\.\.\//g,
    // Command injection
    /[;&|`$()]/g
  ];
  
  const checkString = (str) => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };
  
  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkString(value)) {
        return true;
      }
      if (typeof value === 'object' && value !== null && checkObject(value)) {
        return true;
      }
    }
    return false;
  };
  
  // Verificar URL, body y query params
  if (checkString(req.url) || 
      (req.body && checkObject(req.body)) || 
      (req.query && checkObject(req.query))) {
    
    logger.warn({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      ip: req.realIP,
      userAgent: req.get('User-Agent')
    }, 'Malicious request detected');
    
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request contains potentially malicious content'
    });
  }
  
  next();
};
