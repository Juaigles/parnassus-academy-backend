// src/routes/review.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  createReview,
  getCourseReviews,
  markReviewHelpful,
  reportReview,
  getUserReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';

export const reviewRouter = Router();

// Reseñas de cursos
reviewRouter.post('/courses/:courseId/reviews', requireAuth, createReview);
reviewRouter.get('/courses/:courseId/reviews', getCourseReviews);

// CRUD de reseñas
reviewRouter.put('/reviews/:reviewId', requireAuth, updateReview);
reviewRouter.delete('/reviews/:reviewId', requireAuth, deleteReview);

// Acciones en reseñas
reviewRouter.post('/reviews/:reviewId/helpful', requireAuth, markReviewHelpful);
reviewRouter.post('/reviews/:reviewId/report', requireAuth, reportReview);

// Reseñas del usuario
reviewRouter.get('/users/reviews', requireAuth, getUserReviews);
