// src/services/analyticsService.js
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import Progress from '../models/Progress.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import AppError from '../libs/appError.js';
import mongoose from 'mongoose';
import { logger } from '../libs/logger.js';

/**
 * Servicio completo de Analytics con tracking en tiempo real
 */
class AdvancedAnalyticsService {
  constructor() {
    this.events = new Map();
    this.userSessions = new Map();
    this.courseMetrics = new Map();
  }

  /**
   * Tracking de eventos de usuario en tiempo real
   */
  trackEvent(userId, eventType, data = {}) {
    try {
      const event = {
        userId,
        eventType,
        data,
        timestamp: new Date(),
        sessionId: this.getSessionId(userId),
        ip: data.ip,
        userAgent: data.userAgent
      };

      // Almacenar evento
      if (!this.events.has(userId)) {
        this.events.set(userId, []);
      }
      this.events.get(userId).push(event);

      // Log estructurado
      logger.info('User event tracked', {
        type: 'analytics_event',
        userId,
        eventType,
        data: this.sanitizeData(data),
        correlationId: event.sessionId
      });

      return event;
    } catch (error) {
      logger.error('Error tracking event', { error: error.message, userId, eventType });
      throw error;
    }
  }

  /**
   * Dashboard de métricas en tiempo real
   */
  getRealTimeDashboard() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const allEvents = Array.from(this.events.values()).flat();
    const recentEvents = allEvents.filter(event => event.timestamp >= last24Hours);
    
    return {
      timestamp: now,
      activeUsers24h: new Set(recentEvents.map(e => e.userId)).size,
      totalEvents24h: recentEvents.length,
      topEvents: this.getTopEventTypes(recentEvents),
      revenue24h: this.calculateRevenue24h(recentEvents)
    };
  }

  // Métodos auxiliares
  getSessionId(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, `session_${userId}_${Date.now()}`);
    }
    return this.userSessions.get(userId);
  }

  sanitizeData(data) {
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.creditCard;
    return sanitized;
  }

  getTopEventTypes(events) {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    return Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([eventType, count]) => ({ eventType, count }));
  }

  calculateRevenue24h(events) {
    return events
      .filter(e => e.eventType === 'course_purchased')
      .reduce((total, e) => total + (e.data.amount || 0), 0);
  }
}

export const advancedAnalytics = new AdvancedAnalyticsService();

/**
 * Analytics del curso para instructores
 */
export async function getCourseAnalytics(courseId, instructorId) {
  const course = await Course.findById(courseId);
  if (!course || String(course.owner) !== String(instructorId)) {
    throw new AppError('Course not found or not authorized', 404);
  }

  const [
    totalStudents,
    completionStats,
    revenueStats,
    reviewStats,
    progressData
  ] = await Promise.all([
    // Total de estudiantes
    Purchase.countDocuments({ course: courseId, status: 'completed' }),
    
    // Estadísticas de completado
    Progress.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' },
          completed: { $sum: { $cond: [{ $gte: ['$completionPercentage', 100] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $and: [{ $gt: ['$completionPercentage', 0] }, { $lt: ['$completionPercentage', 100] }] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$completionPercentage', 0] }, 1, 0] } }
        }
      }
    ]),
    
    // Estadísticas de ingresos
    Purchase.aggregate([
      { $match: { course: mongoose.Types.ObjectId(courseId), status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          avgPrice: { $avg: '$amount' },
          salesByMonth: {
            $push: {
              month: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
              amount: '$amount'
            }
          }
        }
      }
    ]),
    
    // Estadísticas de reseñas
    Review.aggregate([
      { $match: { course: mongoose.Types.ObjectId(courseId), status: 'active' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]),
    
    // Datos de progreso detallado
    Progress.find({ courseId })
      .populate('userId', 'email createdAt')
      .sort({ lastActivity: -1 })
      .limit(100)
  ]);

  return {
    overview: {
      totalStudents,
      completionRate: completionStats[0]?.avgCompletion || 0,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      avgRating: reviewStats[0]?.avgRating || 0,
      totalReviews: reviewStats[0]?.totalReviews || 0
    },
    completion: completionStats[0] || {},
    revenue: revenueStats[0] || {},
    reviews: reviewStats[0] || {},
    recentActivity: progressData
  };
}

/**
 * Dashboard de administrador
 */
export async function getAdminDashboard() {
  const [
    totalCourses,
    totalUsers,
    totalRevenue,
    salesData,
    topCourses,
    recentActivity
  ] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments(),
    Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Purchase.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]),
    Course.aggregate([
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'course',
          as: 'purchases'
        }
      },
      {
        $addFields: {
          totalSales: { $size: '$purchases' },
          revenue: { $sum: '$purchases.amount' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]),
    Purchase.find({ status: 'completed' })
      .populate('course', 'title')
      .populate('user', 'email')
      .sort({ completedAt: -1 })
      .limit(20)
  ]);

  return {
    overview: {
      totalCourses,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      salesThisMonth: salesData.filter(s => 
        new Date(s._id).getMonth() === new Date().getMonth()
      ).reduce((sum, s) => sum + s.sales, 0)
    },
    salesChart: salesData.reverse(),
    topCourses,
    recentSales: recentActivity
  };
}

/**
 * Recomendaciones de cursos
 */
export async function getRecommendations(userId) {
  const user = await User.findById(userId);
  const userPurchases = await Purchase.find({
    user: userId,
    status: 'completed'
  }).select('course');

  const purchasedCourseIds = userPurchases.map(p => p.course);

  // Cursos similares basados en tags
  const similarCourses = await Course.aggregate([
    {
      $match: {
        _id: { $nin: purchasedCourseIds },
        status: 'published'
      }
    },
    {
      $lookup: {
        from: 'purchases',
        localField: '_id',
        foreignField: 'course',
        as: 'purchases'
      }
    },
    {
      $addFields: {
        popularity: { $size: '$purchases' }
      }
    },
    { $sort: { popularity: -1, createdAt: -1 } },
    { $limit: 10 }
  ]);

  return {
    recommended: similarCourses,
    trending: await getTrendingCourses(),
    popular: await getPopularCourses()
  };
}

export async function getTrendingCourses() {
  // Cursos con más ventas en los últimos 7 días
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return await Course.aggregate([
    {
      $lookup: {
        from: 'purchases',
        localField: '_id',
        foreignField: 'course',
        pipeline: [
          { $match: { completedAt: { $gte: lastWeek }, status: 'completed' } }
        ],
        as: 'recentPurchases'
      }
    },
    {
      $addFields: {
        recentSales: { $size: '$recentPurchases' }
      }
    },
    { $match: { recentSales: { $gt: 0 } } },
    { $sort: { recentSales: -1 } },
    { $limit: 8 }
  ]);
}

export async function getPopularCourses() {
  return await Course.aggregate([
    {
      $lookup: {
        from: 'purchases',
        localField: '_id',
        foreignField: 'course',
        as: 'purchases'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'course',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        totalSales: { $size: '$purchases' },
        avgRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' }
      }
    },
    { $match: { totalSales: { $gte: 5 } } },
    { $sort: { avgRating: -1, totalSales: -1 } },
    { $limit: 8 }
  ]);
}
