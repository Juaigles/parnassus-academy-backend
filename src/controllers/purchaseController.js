// src/controllers/purchaseController.js
import * as purchaseService from '../services/purchaseService.js';
import * as wishlistService from '../services/wishlistService.js';
import Purchase from '../models/Purchase.js';
import AppError from '../libs/appError.js';

/**
 * Crear intención de compra
 * POST /api/courses/:courseId/purchase
 */
export async function createPurchaseIntent(req, res) {
  try {
    const { courseId } = req.params;
    const { discountCode } = req.body;
    const userId = req.user.id;

    const result = await purchaseService.createPurchaseIntent(userId, courseId, discountCode);

    res.status(201).json({
      success: true,
      data: {
        purchaseId: result.purchase.id,
        clientSecret: result.clientSecret,
        originalAmount: result.originalAmount,
        finalAmount: result.finalAmount,
        discount: result.discount,
        currency: result.purchase.currency
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Verificar acceso a curso
 * GET /api/courses/:courseId/access
 */
export async function checkCourseAccess(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const accessCheck = await purchaseService.canAccessCourse(req.user, courseId);

    res.json({
      success: true,
      data: {
        hasAccess: accessCheck.hasAccess,
        reason: accessCheck.reason,
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

/**
 * Obtener mis cursos comprados
 * GET /api/users/my-courses
 */
export async function getMyCourses(req, res) {
  try {
    const userId = req.user.id;
    const courses = await purchaseService.getUserCourses(userId);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener historial de compras
 * GET /api/users/purchase-history
 */
export async function getPurchaseHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const purchases = await Purchase.find({ user: userId })
      .populate('course', 'title slug marketing.card.coverImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Solicitar reembolso
 * POST /api/purchases/:purchaseId/refund
 */
export async function requestRefund(req, res) {
  try {
    const { purchaseId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim().length < 10) {
      throw new AppError('Refund reason must be at least 10 characters', 400);
    }

    const purchase = await purchaseService.requestRefund(userId, purchaseId, reason);

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: purchase
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Otorgar acceso administrativo
 * POST /api/admin/grant-access
 */
export async function grantAdminAccess(req, res) {
  try {
    const { userId, courseId } = req.body;
    const adminUserId = req.user.id;

    const purchase = await purchaseService.grantAdminAccess(adminUserId, userId, courseId);

    res.json({
      success: true,
      message: 'Access granted successfully',
      data: purchase
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Procesar reembolso (admin)
 * POST /api/admin/purchases/:purchaseId/refund
 */
export async function processRefund(req, res) {
  try {
    const { purchaseId } = req.params;
    const { approved, adminNotes } = req.body;
    const adminUserId = req.user.id;

    const purchase = await purchaseService.processRefund(adminUserId, purchaseId, approved, adminNotes);

    res.json({
      success: true,
      message: `Refund ${approved ? 'approved' : 'rejected'} successfully`,
      data: purchase
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}
