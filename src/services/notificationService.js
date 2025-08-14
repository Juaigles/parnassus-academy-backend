// src/services/notificationService.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import * as emailService from './emailService.js';
import { Server } from 'socket.io';
import webpush from 'web-push';
import { logger } from '../libs/logger.js';
import { env } from '../config/env.js';

/**
 * Servicio avanzado de notificaciones en tiempo real
 */
class RealTimeNotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.subscriptions = new Map();
    
    // Configurar Web Push
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@parnassus-academy.com',
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );
    }
  }

  /**
   * Inicializar Socket.IO
   */
  initializeSocketIO(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? env.FRONTEND_URL : "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      logger.info('User connected to notifications', {
        socketId: socket.id,
        type: 'socket_connection'
      });

      socket.on('authenticate', (data) => {
        const { userId } = data;
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        
        logger.info('User authenticated for notifications', {
          userId,
          socketId: socket.id,
          type: 'socket_auth'
        });
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });

    return this.io;
  }

  /**
   * Enviar notificación en tiempo real
   */
  async sendRealTimeNotification(userId, notification) {
    try {
      const socketId = this.connectedUsers.get(userId);
      
      if (socketId && this.io) {
        this.io.to(socketId).emit('notification', {
          id: Date.now().toString(),
          ...notification,
          timestamp: new Date()
        });
        
        logger.info('Real-time notification sent', {
          userId,
          type: 'realtime_notification',
          notificationType: notification.type
        });
      }
    } catch (error) {
      logger.error('Error sending real-time notification', {
        error: error.message,
        userId,
        notification
      });
    }
  }
}

export const realTimeNotifications = new RealTimeNotificationService();

/**
 * Crear notificación
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
  priority = 'normal',
  channels = { inApp: true, email: false, push: false }
}) {
  
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    priority,
    channels
  });

  // Procesar canales de notificación
  await processNotificationChannels(notification);

  return notification;
}

/**
 * Procesar canales de notificación
 */
async function processNotificationChannels(notification) {
  const user = await User.findById(notification.user);
  if (!user) return;

  // Email
  if (notification.channels.email && !notification.sentChannels.email) {
    try {
      await emailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title,
        content: notification.message,
        type: notification.type,
        data: notification.data
      });
      
      notification.sentChannels.email = true;
      await notification.save();
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  }

  // Push notifications (implementar con Firebase/OneSignal)
  if (notification.channels.push && !notification.sentChannels.push) {
    try {
      await sendPushNotification(user, notification);
      notification.sentChannels.push = true;
      await notification.save();
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  notification.sentChannels.inApp = true;
  await notification.save();
}

/**
 * Obtener notificaciones del usuario
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const skip = (page - 1) * limit;
  
  const filters = { user: userId };
  if (unreadOnly) {
    filters.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    
    Notification.countDocuments(filters),
    
    Notification.countDocuments({ user: userId, read: false })
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId, read: false },
    { read: true, readAt: new Date() },
    { new: true }
  );

  return !!notification;
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  );

  return result.modifiedCount;
}

/**
 * Eliminar notificación
 */
export async function deleteNotification(notificationId, userId) {
  const result = await Notification.deleteOne({
    _id: notificationId,
    user: userId
  });

  return result.deletedCount > 0;
}

/**
 * Crear notificación de compra completada
 */
export async function notifyPurchaseCompleted(userId, courseData) {
  return await createNotification({
    userId,
    type: 'purchase_completed',
    title: '¡Compra completada!',
    message: `Has adquirido el curso "${courseData.title}". ¡Comienza a aprender ya!`,
    data: {
      courseId: courseData.id,
      url: `/courses/${courseData.slug}`
    },
    priority: 'high',
    channels: { inApp: true, email: true, push: true }
  });
}

/**
 * Notificar nueva lección
 */
export async function notifyNewLesson(userIds, courseData, lessonData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'new_lesson',
    title: 'Nueva lección disponible',
    message: `Se ha añadido una nueva lección "${lessonData.title}" al curso "${courseData.title}"`,
    data: {
      courseId: courseData.id,
      lessonId: lessonData.id,
      url: `/courses/${courseData.slug}/lessons/${lessonData.slug}`
    },
    channels: { inApp: true, email: false, push: true }
  }));

  await Notification.insertMany(notifications);
  
  // Procesar notificaciones push en lotes
  for (const notification of notifications) {
    await processNotificationChannels(notification);
  }
}

/**
 * Notificar logro desbloqueado
 */
export async function notifyAchievementUnlocked(userId, achievement) {
  return await createNotification({
    userId,
    type: 'achievement_unlocked',
    title: '¡Logro desbloqueado!',
    message: `Has conseguido el logro "${achievement.name}". ¡Sigue así!`,
    data: {
      achievementId: achievement.id,
      url: '/profile/achievements'
    },
    priority: 'normal',
    channels: { inApp: true, email: false, push: true }
  });
}

/**
 * Recordatorio de estudio
 */
export async function sendStudyReminder(userId, courseData) {
  return await createNotification({
    userId,
    type: 'reminder_study',
    title: 'Tiempo de estudiar',
    message: `No olvides continuar con tu curso "${courseData.title}". ¡Mantén el ritmo!`,
    data: {
      courseId: courseData.id,
      url: `/courses/${courseData.slug}/continue`
    },
    channels: { inApp: true, email: false, push: true }
  });
}

/**
 * Anuncio del instructor
 */
export async function notifyInstructorAnnouncement(userIds, courseData, announcement) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'instructor_announcement',
    title: `Anuncio de ${courseData.instructorName}`,
    message: announcement.message,
    data: {
      courseId: courseData.id,
      announcementId: announcement.id,
      url: `/courses/${courseData.slug}/announcements`
    },
    priority: announcement.priority || 'normal',
    channels: { inApp: true, email: true, push: false }
  }));

  await Notification.insertMany(notifications);
}

/**
 * Notificar certificado listo
 */
export async function notifyCertificateReady(userId, courseData, certificateId) {
  return await createNotification({
    userId,
    type: 'certificate_ready',
    title: '¡Certificado listo!',
    message: `Tu certificado del curso "${courseData.title}" está listo para descargar.`,
    data: {
      courseId: courseData.id,
      certificateId,
      url: `/certificates/${certificateId}`
    },
    priority: 'high',
    channels: { inApp: true, email: true, push: true }
  });
}

/**
 * Configurar preferencias de notificación
 */
export async function updateNotificationPreferences(userId, preferences) {
  const user = await User.findByIdAndUpdate(
    userId,
    { 'preferences.notifications': preferences },
    { new: true }
  );

  return user?.preferences?.notifications || {};
}

/**
 * Obtener preferencias de notificación
 */
export async function getNotificationPreferences(userId) {
  const user = await User.findById(userId).select('preferences.notifications');
  
  return user?.preferences?.notifications || {
    email: {
      purchases: true,
      courseUpdates: false,
      achievements: false,
      reminders: true,
      announcements: true
    },
    push: {
      purchases: true,
      courseUpdates: true,
      achievements: true,
      reminders: true,
      announcements: false
    }
  };
}

/**
 * Enviar notificación push (implementación con Firebase)
 */
async function sendPushNotification(user, notification) {
  // Implementar con Firebase Cloud Messaging o OneSignal
  // Ejemplo conceptual:
  
  if (!user.pushTokens || user.pushTokens.length === 0) {
    return;
  }

  const payload = {
    notification: {
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: notification.data
    }
  };

  // Aquí iría la implementación real de Firebase
  console.log('Sending push notification:', payload);
}
