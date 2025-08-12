import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { createCourse, updateCourse, submitCourse, listPublic, getCourse } from '../controllers/courseController.js';

export const courseRouter = Router();
courseRouter.get('/courses', listPublic);
courseRouter.get('/courses/:id', optionalAuth, getCourse);
courseRouter.post('/courses', requireAuth, requireRole('teacher'), createCourse);
courseRouter.patch('/courses/:id', requireAuth, requireRole('teacher'), updateCourse);
courseRouter.post('/courses/:id/submit', requireAuth, requireRole('teacher'), submitCourse);
