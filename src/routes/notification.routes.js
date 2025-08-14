// src/routes/notification.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notificationController.js';

export const notificationRouter = Router();

// Gestión de notificaciones
notificationRouter.get('/notifications', requireAuth, getUserNotifications);
notificationRouter.put('/notifications/:notificationId/read', requireAuth, markNotificationAsRead);
notificationRouter.put('/notifications/read-all', requireAuth, markAllNotificationsAsRead);
notificationRouter.delete('/notifications/:notificationId', requireAuth, deleteNotification);

// Preferencias
notificationRouter.get('/notifications/preferences', requireAuth, getNotificationPreferences);
notificationRouter.put('/notifications/preferences', requireAuth, updateNotificationPreferences);
