// src/controllers/reviewController.js
import * as reviewService from '../services/reviewService.js';
import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(5).max(100),
  comment: z.string().min(10).max(1000)
});

const getReviewsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).optional().default('newest')
});

/**
 * Crear reseña
 * POST /api/courses/:courseId/reviews
 */
export async function createReview(req, res) {
  try {
    const { courseId } = req.params;
    const reviewData = createReviewSchema.parse(req.body);
    
    const review = await reviewService.createReview({
      userId: req.user.id,
      courseId,
      ...reviewData
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener reseñas de un curso
 * GET /api/courses/:courseId/reviews
 */
export async function getCourseReviews(req, res) {
  try {
    const { courseId } = req.params;
    const query = getReviewsSchema.parse(req.query);
    
    const result = await reviewService.getCourseReviews(courseId, query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Marcar reseña como útil
 * POST /api/reviews/:reviewId/helpful
 */
export async function markReviewHelpful(req, res) {
  try {
    const { reviewId } = req.params;
    
    const result = await reviewService.markReviewHelpful(reviewId, req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Reportar reseña
 * POST /api/reviews/:reviewId/report
 */
export async function reportReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const result = await reviewService.reportReview(reviewId, req.user.id, reason);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener reseñas del usuario
 * GET /api/users/reviews
 */
export async function getUserReviews(req, res) {
  try {
    const query = getReviewsSchema.parse(req.query);
    
    const result = await reviewService.getUserReviews(req.user.id, query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Actualizar reseña
 * PUT /api/reviews/:reviewId
 */
export async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const reviewData = createReviewSchema.partial().parse(req.body);
    
    const review = await reviewService.updateReview(reviewId, req.user.id, reviewData);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Eliminar reseña
 * DELETE /api/reviews/:reviewId
 */
export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    
    const result = await reviewService.deleteReview(reviewId, req.user.id, req.user.role);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}
