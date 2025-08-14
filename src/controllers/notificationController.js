// src/controllers/notificationController.js
import * as notificationService from '../services/notificationService.js';
import { z } from 'zod';

const getNotificationsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val) || 20, 50)),
  unreadOnly: z.string().optional().transform(val => val === 'true')
});

/**
 * Obtener notificaciones del usuario
 * GET /api/notifications
 */
export async function getUserNotifications(req, res) {
  try {
    const query = getNotificationsSchema.parse(req.query);
    
    const result = await notificationService.getUserNotifications(req.user.id, query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Marcar notificación como leída
 * PUT /api/notifications/:notificationId/read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    
    const success = await notificationService.markNotificationAsRead(notificationId, req.user.id);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Marcar todas las notificaciones como leídas
 * PUT /api/notifications/read-all
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const count = await notificationService.markAllNotificationsAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Eliminar notificación
 * DELETE /api/notifications/:notificationId
 */
export async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;
    
    const success = await notificationService.deleteNotification(notificationId, req.user.id);

    if (success) {
      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener preferencias de notificación
 * GET /api/notifications/preferences
 */
export async function getNotificationPreferences(req, res) {
  try {
    const preferences = await notificationService.getNotificationPreferences(req.user.id);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Actualizar preferencias de notificación
 * PUT /api/notifications/preferences
 */
export async function updateNotificationPreferences(req, res) {
  try {
    const preferences = await notificationService.updateNotificationPreferences(req.user.id, req.body);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
