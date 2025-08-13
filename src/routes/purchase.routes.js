// src/routes/purchase.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  createPurchaseIntent,
  checkCourseAccess,
  getMyCourses,
  getPurchaseHistory,
  requestRefund,
  grantAdminAccess,
  processRefund
} from '../controllers/purchaseController.js';

export const purchaseRouter = Router();

// Compras
purchaseRouter.post('/courses/:courseId/purchase', requireAuth, createPurchaseIntent);
purchaseRouter.get('/courses/:courseId/access', requireAuth, checkCourseAccess);

// Usuario
purchaseRouter.get('/users/my-courses', requireAuth, getMyCourses);
purchaseRouter.get('/users/purchase-history', requireAuth, getPurchaseHistory);
purchaseRouter.post('/purchases/:purchaseId/refund', requireAuth, requestRefund);

// Admin
purchaseRouter.post('/admin/grant-access', requireAuth, requireRole('admin'), grantAdminAccess);
purchaseRouter.post('/admin/purchases/:purchaseId/refund', requireAuth, requireRole('admin'), processRefund);
