// src/middlewares/monitoring.js
import { logger } from '../libs/logger.js';

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        by_method: {},
        by_status: {},
        by_endpoint: {}
      },
      response_times: [],
      errors: {
        total: 0,
        by_type: {},
        by_endpoint: {}
      },
      active_users: new Set(),
      memory_usage: [],
      cpu_usage: []
    };
    
    // Limpiar métricas antiguas cada hora
    setInterval(() => this.cleanOldMetrics(), 60 * 60 * 1000);
    
    // Recoger métricas del sistema cada 30 segundos
    setInterval(() => this.collectSystemMetrics(), 30 * 1000);
  }
  
  recordRequest(method, endpoint, statusCode, responseTime, userId) {
    this.metrics.requests.total++;
    
    // Por método
    this.metrics.requests.by_method[method] = 
      (this.metrics.requests.by_method[method] || 0) + 1;
    
    // Por status code
    this.metrics.requests.by_status[statusCode] = 
      (this.metrics.requests.by_status[statusCode] || 0) + 1;
    
    // Por endpoint (limpiar IDs para agrupar)
    const cleanEndpoint = endpoint.replace(/\/[0-9a-f]{24}/g, '/:id');
    this.metrics.requests.by_endpoint[cleanEndpoint] = 
      (this.metrics.requests.by_endpoint[cleanEndpoint] || 0) + 1;
    
    // Tiempo de respuesta
    this.metrics.response_times.push({
      time: responseTime,
      timestamp: Date.now(),
      endpoint: cleanEndpoint
    });
    
    // Usuario activo
    if (userId) {
      this.metrics.active_users.add(userId);
    }
    
    // Limpiar response_times si hay muchos
    if (this.metrics.response_times.length > 10000) {
      this.metrics.response_times = this.metrics.response_times.slice(-5000);
    }
  }
  
  recordError(type, endpoint, error) {
    this.metrics.errors.total++;
    
    this.metrics.errors.by_type[type] = 
      (this.metrics.errors.by_type[type] || 0) + 1;
    
    const cleanEndpoint = endpoint.replace(/\/[0-9a-f]{24}/g, '/:id');
    this.metrics.errors.by_endpoint[cleanEndpoint] = 
      (this.metrics.errors.by_endpoint[cleanEndpoint] || 0) + 1;
  }
  
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory_usage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    // Mantener solo las últimas 720 muestras (6 horas si es cada 30s)
    if (this.metrics.memory_usage.length > 720) {
      this.metrics.memory_usage = this.metrics.memory_usage.slice(-360);
    }
  }
  
  cleanOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Limpiar response times viejos
    this.metrics.response_times = this.metrics.response_times.filter(
      rt => rt.timestamp > oneHourAgo
    );
    
    // Limpiar usuarios activos (cada hora se resetea)
    this.metrics.active_users.clear();
  }
  
  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Response times recientes
    const recentResponseTimes = this.metrics.response_times.filter(
      rt => rt.timestamp > fiveMinutesAgo
    );
    
    const avgResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((sum, rt) => sum + rt.time, 0) / recentResponseTimes.length
      : 0;
    
    const p95ResponseTime = this.calculatePercentile(
      recentResponseTimes.map(rt => rt.time), 95
    );
    
    return {
      summary: {
        total_requests: this.metrics.requests.total,
        total_errors: this.metrics.errors.total,
        error_rate: this.metrics.requests.total > 0 
          ? (this.metrics.errors.total / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        active_users: this.metrics.active_users.size,
        avg_response_time: Math.round(avgResponseTime),
        p95_response_time: Math.round(p95ResponseTime)
      },
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      performance: {
        avg_response_time_ms: Math.round(avgResponseTime),
        p95_response_time_ms: Math.round(p95ResponseTime),
        requests_per_minute: this.metrics.response_times.filter(
          rt => rt.timestamp > oneMinuteAgo
        ).length
      },
      system: {
        memory: this.metrics.memory_usage.slice(-1)[0] || {},
        uptime: process.uptime()
      }
    };
  }
  
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile / 100) - 1;
    return sorted[index] || 0;
  }
  
  getHealthStatus() {
    const metrics = this.getMetrics();
    const memory = metrics.system.memory;
    
    const issues = [];
    
    // Verificar error rate
    const errorRate = parseFloat(metrics.summary.error_rate);
    if (errorRate > 5) {
      issues.push(`High error rate: ${metrics.summary.error_rate}`);
    }
    
    // Verificar response time
    if (metrics.performance.p95_response_time_ms > 2000) {
      issues.push(`Slow response time: ${metrics.performance.p95_response_time_ms}ms P95`);
    }
    
    // Verificar memoria
    if (memory.heapUsed && memory.heapTotal) {
      const memoryUsage = (memory.heapUsed / memory.heapTotal) * 100;
      if (memoryUsage > 90) {
        issues.push(`High memory usage: ${memoryUsage.toFixed(1)}%`);
      }
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}

// Instancia global
const metricsCollector = new MetricsCollector();

// Middleware de métricas
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Interceptar respuesta para medir tiempo
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - start;
    
    // Registrar métricas
    metricsCollector.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      req.user?.id
    );
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware de errores para métricas
export const errorMetricsMiddleware = (err, req, res, next) => {
  // Registrar error en métricas
  let errorType = 'unknown';
  
  if (err.name === 'ValidationError') errorType = 'validation';
  else if (err.name === 'UnauthorizedError') errorType = 'auth';
  else if (err.status >= 400 && err.status < 500) errorType = 'client';
  else if (err.status >= 500) errorType = 'server';
  
  metricsCollector.recordError(errorType, req.path, err);
  
  next(err);
};

// Endpoint para métricas
export const getMetrics = (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error({ error }, 'Error getting metrics');
    res.status(500).json({ error: 'Failed to get metrics' });
  }
};

// Endpoint para health check mejorado
export const getHealthCheck = (req, res) => {
  try {
    const health = metricsCollector.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error({ error }, 'Error getting health status');
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Alertas automáticas
export const checkAlerts = () => {
  const health = metricsCollector.getHealthStatus();
  
  if (health.status !== 'healthy') {
    logger.warn({
      status: health.status,
      issues: health.issues
    }, 'System health alert');
    
    // Aquí se pueden enviar alertas a Slack, email, etc.
  }
};

// Ejecutar check de alertas cada 5 minutos
setInterval(checkAlerts, 5 * 60 * 1000);

export { metricsCollector };
