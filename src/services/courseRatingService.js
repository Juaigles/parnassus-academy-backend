import Course from '../models/Course.js';
import Review from '../models/Review.js';

export const courseRatingService = {
  /**
   * Actualiza las estadísticas de rating de un curso
   * @param {string} courseId - ID del curso
   */
  async updateCourseRating(courseId) {
    try {
      // Obtener todas las reviews del curso
      const reviews = await Review.find({ courseId }).select('rating');
      
      if (reviews.length === 0) {
        // No hay reviews, resetear estadísticas
        await Course.findByIdAndUpdate(courseId, {
          'stats.totalReviews': 0,
          'stats.averageRating': 0,
          'stats.ratingBreakdown': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        return;
      }

      // Calcular estadísticas
      const totalReviews = reviews.length;
      const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatingSum = 0;

      reviews.forEach(review => {
        const rating = review.rating;
        ratingBreakdown[rating]++;
        totalRatingSum += rating;
      });

      const averageRating = Math.round((totalRatingSum / totalReviews) * 10) / 10; // Redondear a 1 decimal

      // Actualizar el curso
      await Course.findByIdAndUpdate(courseId, {
        'stats.totalReviews': totalReviews,
        'stats.averageRating': averageRating,
        'stats.ratingBreakdown': ratingBreakdown
      });

      return {
        totalReviews,
        averageRating,
        ratingBreakdown
      };
    } catch (error) {
      console.error('Error updating course rating:', error);
      throw error;
    }
  },

  /**
   * Obtiene las estadísticas de rating de un curso
   * @param {string} courseId - ID del curso
   */
  async getCourseRatingStats(courseId) {
    try {
      const course = await Course.findById(courseId).select('stats');
      if (!course) {
        throw new Error('Course not found');
      }

      return {
        totalReviews: course.stats.totalReviews || 0,
        averageRating: course.stats.averageRating || 0,
        ratingBreakdown: course.stats.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    } catch (error) {
      console.error('Error getting course rating stats:', error);
      throw error;
    }
  }
};
