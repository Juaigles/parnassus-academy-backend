// src/routes/enhanced-admin.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { 
  getMetrics, 
  getHealthCheck 
} from '../middlewares/monitoring.js';
import { 
  getCacheStats, 
  clearCache 
} from '../middlewares/caching.js';
import { 
  analyzeDatabasePerformance 
} from '../utils/databaseOptimization.js';
import { enhancedLogger } from '../libs/enhancedLogger.js';

export const enhancedAdminRouter = Router();

/**
 * Métricas del sistema
 * GET /api/admin/metrics
 */
enhancedAdminRouter.get('/metrics', 
  requireAuth, 
  requireRole('admin'),
  (req, res) => {
    try {
      const metrics = getMetrics();
      
      enhancedLogger.audit('view_system_metrics', {
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      });
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      enhancedLogger.error({ error }, 'Error getting system metrics');
      res.status(500).json({
        success: false,
        error: 'Failed to get system metrics'
      });
    }
  }
);

/**
 * Health check avanzado
 * GET /api/admin/health
 */
enhancedAdminRouter.get('/health',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      const health = getHealthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }
);

/**
 * Estadísticas de cache
 * GET /api/admin/cache/stats
 */
enhancedAdminRouter.get('/cache/stats',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      const stats = getCacheStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get cache stats'
      });
    }
  }
);

/**
 * Limpiar cache
 * POST /api/admin/cache/clear
 */
enhancedAdminRouter.post('/cache/clear',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      clearCache();
      
      enhancedLogger.audit('clear_system_cache', {
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      });
      
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }
);

/**
 * Performance de base de datos
 * GET /api/admin/db/performance
 */
enhancedAdminRouter.get('/db/performance',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const performance = await analyzeDatabasePerformance();
      
      enhancedLogger.audit('view_db_performance', {
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      });
      
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      enhancedLogger.error({ error }, 'Error analyzing database performance');
      res.status(500).json({
        success: false,
        error: 'Failed to analyze database performance'
      });
    }
  }
);

/**
 * Logs recientes del sistema
 * GET /api/admin/logs
 */
enhancedAdminRouter.get('/logs',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      const { level = 'info', limit = 100 } = req.query;
      
      // Aquí normalmente conectarías con tu sistema de logs
      // Por ahora, devolvemos un placeholder
      res.json({
        success: true,
        data: {
          message: 'Log endpoint placeholder - integrate with your log aggregation system',
          filters: { level, limit },
          suggestion: 'Connect with ELK stack, Loki, or similar'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get logs'
      });
    }
  }
);

/**
 * Configuración del sistema
 * GET /api/admin/config
 */
enhancedAdminRouter.get('/config',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      const config = {
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        features: {
          caching: true,
          monitoring: true,
          security: true,
          rateLimiting: true,
          auditLogging: true,
          xssProtection: true,
          dbOptimization: true
        }
      };
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system config'
      });
    }
  }
);

/**
 * Alertas del sistema
 * GET /api/admin/alerts
 */
enhancedAdminRouter.get('/alerts',
  requireAuth,
  requireRole('admin'),
  (req, res) => {
    try {
      // Placeholder para sistema de alertas
      // Aquí conectarías con tu sistema de alertas real
      const alerts = [
        {
          id: 1,
          type: 'info',
          message: 'System running optimally',
          timestamp: new Date().toISOString(),
          resolved: true
        }
      ];
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get alerts'
      });
    }
  }
);
