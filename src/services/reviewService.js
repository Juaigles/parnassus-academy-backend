// src/services/reviewService.js
import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import AppError from '../libs/appError.js';
import mongoose from 'mongoose';
import { courseRatingService } from './courseRatingService.js';

/**
 * Crear una reseña
 */
export async function createReview({ userId, courseId, rating, title, comment }) {
  // Verificar que el usuario haya comprado el curso
  const purchase = await Purchase.findOne({
    user: userId,
    course: courseId,
    status: 'completed'
  });

  if (!purchase) {
    throw new AppError('You must purchase this course to leave a review', 403);
  }

  // Verificar que no haya reseñado ya
  const existingReview = await Review.findOne({
    user: userId,
    course: courseId
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this course', 409);
  }

  // Crear reseña
  const review = await Review.create({
    user: userId,
    course: courseId,
    rating,
    title,
    comment,
    metadata: {
      completionPercentage: purchase.completionPercentage || 0,
      timeSpent: purchase.timeSpent || 0
    }
  });

  // Actualizar rating promedio del curso
  await courseRatingService.updateCourseRating(courseId);

  return await Review.findById(review._id)
    .populate('user', 'email firstName lastName avatar')
    .lean();
}

/**
 * Obtener reseñas de un curso
 */
export async function getCourseReviews(courseId, { page = 1, limit = 10, sort = 'newest' } = {}) {
  const skip = (page - 1) * limit;
  
  let sortOrder = { createdAt: -1 }; // newest
  if (sort === 'oldest') sortOrder = { createdAt: 1 };
  if (sort === 'highest') sortOrder = { rating: -1, createdAt: -1 };
  if (sort === 'lowest') sortOrder = { rating: 1, createdAt: -1 };
  if (sort === 'helpful') sortOrder = { helpfulCount: -1, createdAt: -1 };

  const [reviews, total, stats] = await Promise.all([
    Review.find({ course: courseId, status: 'active' })
      .populate('user', 'firstName lastName avatar')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    Review.countDocuments({ course: courseId, status: 'active' }),
    
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
    ])
  ]);

  // Calcular distribución de ratings
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (stats[0]?.ratingDistribution) {
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
  }

  return {
    reviews: reviews.map(review => ({
      ...review,
      helpfulCount: review.helpful?.length || 0,
      isHelpful: false // Se actualizará en el frontend si el usuario está logueado
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    stats: {
      avgRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      distribution
    }
  };
}

/**
 * Marcar reseña como útil
 */
export async function markReviewHelpful(reviewId, userId) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const alreadyMarked = review.helpful.includes(userId);
  
  if (alreadyMarked) {
    // Quitar like
    review.helpful = review.helpful.filter(id => !id.equals(userId));
  } else {
    // Añadir like
    review.helpful.push(userId);
  }

  await review.save();
  
  return {
    helpful: !alreadyMarked,
    helpfulCount: review.helpful.length
  };
}

/**
 * Reportar reseña
 */
export async function reportReview(reviewId, userId, reason) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (!review.reported.includes(userId)) {
    review.reported.push(userId);
    await review.save();
  }

  // Si hay más de 3 reportes, ocultar automáticamente
  if (review.reported.length >= 3) {
    review.status = 'hidden';
    await review.save();
  }

  return { reported: true };
}

/**
 * Obtener reseñas del usuario
 */
export async function getUserReviews(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ user: userId })
      .populate('course', 'title slug thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    
    Review.countDocuments({ user: userId })
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Actualizar una reseña
 */
export async function updateReview(reviewId, userId, { rating, title, comment }) {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  
  if (!review) {
    throw new AppError('Review not found or not authorized', 404);
  }

  const updateData = {};
  if (rating !== undefined) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (comment !== undefined) updateData.comment = comment;
  updateData.updatedAt = new Date();

  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    updateData,
    { new: true }
  ).populate('user', 'firstName lastName profilePicture');

  // Si se cambió el rating, actualizar estadísticas del curso
  if (rating !== undefined) {
    await courseRatingService.updateCourseRating(review.course);
  }

  return updatedReview;
}

/**
 * Eliminar una reseña
 */
export async function deleteReview(reviewId, userId, userRole) {
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Solo el autor o un admin pueden eliminar
  if (review.user.toString() !== userId && userRole !== 'admin') {
    throw new AppError('Not authorized to delete this review', 403);
  }

  const courseId = review.course;
  await Review.findByIdAndDelete(reviewId);

  // Actualizar estadísticas del curso
  await courseRatingService.updateCourseRating(courseId);

  return { message: 'Review deleted successfully' };
}
