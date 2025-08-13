// src/services/wishlistService.js
import Wishlist from '../models/Wishlist.js';
import Course from '../models/Course.js';
import AppError from '../libs/appError.js';
import * as purchaseService from './purchaseService.js';

/**
 * Obtener wishlist del usuario
 */
export async function getUserWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'courses',
    match: { status: 'published' }, // Solo cursos publicados
    select: 'title slug description excerpt level pricing marketing.card.coverImageUrl tags'
  });
  
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, courses: [] });
    await wishlist.save();
  }
  
  // Filtrar cursos que ya fueron comprados
  const coursesWithPurchaseStatus = await Promise.all(
    wishlist.courses.map(async (course) => {
      const hasAccess = await purchaseService.hasAccessToCourse(userId, course._id);
      return {
        ...course.toJSON(),
        alreadyPurchased: hasAccess
      };
    })
  );
  
  return {
    ...wishlist.toJSON(),
    courses: coursesWithPurchaseStatus
  };
}

/**
 * Añadir curso a wishlist
 */
export async function addToWishlist(userId, courseId) {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  
  if (course.status !== 'published') {
    throw new AppError('Course is not available', 400);
  }
  
  // Verificar si ya está comprado
  const hasAccess = await purchaseService.hasAccessToCourse(userId, courseId);
  if (hasAccess) {
    throw new AppError('Course already purchased', 400);
  }
  
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, courses: [] });
  }
  
  // Verificar si ya está en la wishlist
  if (wishlist.courses.includes(courseId)) {
    throw new AppError('Course already in wishlist', 400);
  }
  
  wishlist.courses.push(courseId);
  await wishlist.save();
  
  return await getUserWishlist(userId);
}

/**
 * Remover curso de wishlist
 */
export async function removeFromWishlist(userId, courseId) {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  
  const courseIndex = wishlist.courses.indexOf(courseId);
  if (courseIndex === -1) {
    throw new AppError('Course not in wishlist', 400);
  }
  
  wishlist.courses.splice(courseIndex, 1);
  await wishlist.save();
  
  return await getUserWishlist(userId);
}

/**
 * Verificar si un curso está en la wishlist
 */
export async function isInWishlist(userId, courseId) {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return false;
  
  return wishlist.courses.includes(courseId);
}

/**
 * Limpiar wishlist (después de compras)
 */
export async function removeMultipleFromWishlist(userId, courseIds) {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return;
  
  wishlist.courses = wishlist.courses.filter(
    courseId => !courseIds.includes(courseId.toString())
  );
  
  await wishlist.save();
  return wishlist;
}
