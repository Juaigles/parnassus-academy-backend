// src/controllers/wishlistController.js
import * as wishlistService from '../services/wishlistService.js';

/**
 * Obtener mi wishlist
 * GET /api/users/wishlist
 */
export async function getMyWishlist(req, res) {
  try {
    const userId = req.user.id;
    const wishlist = await wishlistService.getUserWishlist(userId);

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Añadir curso a wishlist
 * POST /api/users/wishlist/:courseId
 */
export async function addToWishlist(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const wishlist = await wishlistService.addToWishlist(userId, courseId);

    res.status(201).json({
      success: true,
      message: 'Course added to wishlist',
      data: wishlist
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Remover curso de wishlist
 * DELETE /api/users/wishlist/:courseId
 */
export async function removeFromWishlist(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const wishlist = await wishlistService.removeFromWishlist(userId, courseId);

    res.json({
      success: true,
      message: 'Course removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Verificar si curso está en wishlist
 * GET /api/users/wishlist/:courseId/check
 */
export async function checkInWishlist(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const isInWishlist = await wishlistService.isInWishlist(userId, courseId);

    res.json({
      success: true,
      data: {
        isInWishlist,
        courseId
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}
