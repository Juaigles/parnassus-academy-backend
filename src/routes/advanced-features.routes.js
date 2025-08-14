// src/routes/advanced-features.routes.js
import express from 'express';
import { requireAuth as auth } from '../middlewares/auth.js';
import { advancedAnalytics } from '../services/analyticsService.js';
import { realTimeNotifications } from '../services/notificationService.js';
import { twoFactorService } from '../services/twoFactorService.js';
import { pwaService } from '../services/pwaService.js';
import { logger } from '../libs/logger.js';
import { cacheMiddleware } from '../middlewares/caching.js';

const router = express.Router();

// ====================================
// 📊 ANALYTICS ENDPOINTS
// ====================================

/**
 * @route GET /api/advanced/analytics/dashboard
 * @desc Dashboard de métricas en tiempo real
 */
router.get('/analytics/dashboard', 
  auth, 
  cacheMiddleware('analytics_dashboard', 60), // Cache por 1 minuto
  async (req, res) => {
    try {
      const dashboard = advancedAnalytics.getRealTimeDashboard();
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error getting analytics dashboard', { error: error.message });
      res.status(500).json({
        error: 'Error obteniendo dashboard de analytics'
      });
    }
  }
);

/**
 * @route POST /api/advanced/analytics/track
 * @desc Trackear evento de usuario
 */
router.post('/analytics/track', auth, async (req, res) => {
  try {
    const { eventType, data } = req.body;
    const { userId } = req.user;
    
    const event = advancedAnalytics.trackEvent(userId, eventType, {
      ...data,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { eventId: event.sessionId }
    });
  } catch (error) {
    logger.error('Error tracking event', { error: error.message });
    res.status(500).json({
      error: 'Error tracking evento'
    });
  }
});

// ====================================
// 📱 NOTIFICACIONES ENDPOINTS
// ====================================

/**
 * @route POST /api/advanced/notifications/send
 * @desc Enviar notificación a usuario específico
 */
router.post('/notifications/send', auth, async (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    await realTimeNotifications.sendRealTimeNotification(userId, notification);
    
    res.json({
      success: true,
      message: 'Notificación enviada'
    });
  } catch (error) {
    logger.error('Error sending notification', { error: error.message });
    res.status(500).json({
      error: 'Error enviando notificación'
    });
  }
});

/**
 * @route GET /api/advanced/notifications/stats
 * @desc Estadísticas de notificaciones
 */
router.get('/notifications/stats', 
  auth, 
  cacheMiddleware('notification_stats', 30),
  async (req, res) => {
    try {
      const stats = realTimeNotifications.connectedUsers?.size || 0;
      
      res.json({
        success: true,
        data: {
          connectedUsers: stats,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error getting notification stats', { error: error.message });
      res.status(500).json({
        error: 'Error obteniendo estadísticas'
      });
    }
  }
);

// ====================================
// 🔐 2FA ENDPOINTS
// ====================================

/**
 * @route POST /api/advanced/2fa/generate
 * @desc Generar secreto 2FA
 */
router.post('/2fa/generate', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await twoFactorService.generateSecret(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error generating 2FA secret', { error: error.message });
    res.status(500).json({
      error: 'Error generando secreto 2FA'
    });
  }
});

/**
 * @route POST /api/advanced/2fa/enable
 * @desc Activar 2FA
 */
router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;
    
    const result = await twoFactorService.enable2FA(userId, token);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error enabling 2FA', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * @route POST /api/advanced/2fa/disable
 * @desc Desactivar 2FA
 */
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;
    
    const result = await twoFactorService.disable2FA(userId, token);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error disabling 2FA', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * @route POST /api/advanced/2fa/verify
 * @desc Verificar código 2FA
 */
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;
    
    const result = await twoFactorService.verifyLoginToken(userId, token);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying 2FA', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced/2fa/status
 * @desc Estado de 2FA del usuario
 */
router.get('/2fa/status', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const enabled = await twoFactorService.is2FAEnabled(userId);
    
    res.json({
      success: true,
      data: { enabled }
    });
  } catch (error) {
    logger.error('Error checking 2FA status', { error: error.message });
    res.status(500).json({
      error: 'Error verificando estado 2FA'
    });
  }
});

/**
 * @route POST /api/advanced/2fa/backup-codes/regenerate
 * @desc Regenerar códigos de backup
 */
router.post('/2fa/backup-codes/regenerate', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await twoFactorService.regenerateBackupCodes(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error regenerating backup codes', { error: error.message });
    res.status(500).json({
      error: 'Error regenerando códigos de backup'
    });
  }
});

// ====================================
// 📱 PWA ENDPOINTS
// ====================================

/**
 * @route GET /api/advanced/pwa/stats
 * @desc Estadísticas PWA
 */
router.get('/pwa/stats', 
  auth, 
  cacheMiddleware('pwa_stats', 300), // Cache por 5 minutos
  async (req, res) => {
    try {
      const stats = pwaService.getPWAStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting PWA stats', { error: error.message });
      res.status(500).json({
        error: 'Error obteniendo estadísticas PWA'
      });
    }
  }
);

// ====================================
// 🎯 ENDPOINTS COMBINADOS
// ====================================

/**
 * @route GET /api/advanced/dashboard/complete
 * @desc Dashboard completo con todas las métricas
 */
router.get('/dashboard/complete', 
  auth, 
  cacheMiddleware('complete_dashboard', 120), // Cache por 2 minutos
  async (req, res) => {
    try {
      const [
        analytics,
        notificationStats,
        twoFactorStats,
        pwaStats
      ] = await Promise.all([
        advancedAnalytics.getRealTimeDashboard(),
        { connectedUsers: realTimeNotifications.connectedUsers?.size || 0 },
        twoFactorService.get2FAStats(),
        pwaService.getPWAStats()
      ]);

      res.json({
        success: true,
        data: {
          analytics,
          notifications: notificationStats,
          twoFactor: twoFactorStats,
          pwa: pwaStats,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error getting complete dashboard', { error: error.message });
      res.status(500).json({
        error: 'Error obteniendo dashboard completo'
      });
    }
  }
);

/**
 * @route POST /api/advanced/user/activity
 * @desc Trackear actividad completa del usuario
 */
router.post('/user/activity', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { action, data } = req.body;
    
    // Track en analytics
    advancedAnalytics.trackEvent(userId, action, data);
    
    // Enviar notificación si es necesario
    if (data.sendNotification) {
      await realTimeNotifications.sendRealTimeNotification(userId, {
        type: 'activity_update',
        title: data.title || 'Actividad actualizada',
        message: data.message || 'Tu actividad ha sido registrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Actividad registrada exitosamente'
    });
  } catch (error) {
    logger.error('Error tracking user activity', { error: error.message });
    res.status(500).json({
      error: 'Error registrando actividad'
    });
  }
});

export default router;
