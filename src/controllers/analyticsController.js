// src/controllers/analyticsController.js
import * as analyticsService from '../services/analyticsService.js';

/**
 * Analytics del curso para instructores
 * GET /api/analytics/courses/:courseId
 */
export async function getCourseAnalytics(req, res) {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;
    
    const analytics = await analyticsService.getCourseAnalytics(courseId, instructorId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Dashboard de administrador
 * GET /api/analytics/admin/dashboard
 */
export async function getAdminDashboard(req, res) {
  try {
    const dashboard = await analyticsService.getAdminDashboard();

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Recomendaciones personalizadas
 * GET /api/analytics/recommendations
 */
export async function getRecommendations(req, res) {
  try {
    const userId = req.user.id;
    
    const recommendations = await analyticsService.getRecommendations(userId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Cursos en tendencia
 * GET /api/analytics/trending
 */
export async function getTrendingCourses(req, res) {
  try {
    const trending = await analyticsService.getTrendingCourses();

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Cursos populares
 * GET /api/analytics/popular
 */
export async function getPopularCourses(req, res) {
  try {
    const popular = await analyticsService.getPopularCourses();

    res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
