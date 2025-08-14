// src/routes/analytics.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  getCourseAnalytics,
  getAdminDashboard,
  getRecommendations,
  getTrendingCourses,
  getPopularCourses
} from '../controllers/analyticsController.js';

export const analyticsRouter = Router();

// Analytics para instructores
analyticsRouter.get('/analytics/courses/:courseId', requireAuth, requireRole('teacher'), getCourseAnalytics);

// Analytics para admin
analyticsRouter.get('/analytics/admin/dashboard', requireAuth, requireRole('admin'), getAdminDashboard);

// Recomendaciones y tendencias (públicas)
analyticsRouter.get('/analytics/recommendations', requireAuth, getRecommendations);
analyticsRouter.get('/analytics/trending', getTrendingCourses);
analyticsRouter.get('/analytics/popular', getPopularCourses);
