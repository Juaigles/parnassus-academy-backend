import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { createModule, updateModule, deleteModule, listModulesByCourse } from '../controllers/moduleController.js';

export const moduleRouter = Router();
moduleRouter.get('/courses/:courseId/modules', optionalAuth, listModulesByCourse);
moduleRouter.post('/modules', requireAuth, requireRole('teacher'), createModule);
moduleRouter.patch('/modules/:id', requireAuth, requireRole('teacher'), updateModule);
moduleRouter.delete('/modules/:id', requireAuth, requireRole('teacher'), deleteModule);
