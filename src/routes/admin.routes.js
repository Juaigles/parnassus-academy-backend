import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { listApprovalRequests, decideApproval, publishCourse } from '../controllers/adminController.js';

export const adminRouter = Router();
adminRouter.get('/admin/approval-requests', requireAuth, requireRole('admin'), listApprovalRequests);
adminRouter.post('/admin/approval-requests/:approvalId/decide', requireAuth, requireRole('admin'), decideApproval);
adminRouter.post('/admin/courses/:courseId/publish', requireAuth, requireRole('admin'), publishCourse);
