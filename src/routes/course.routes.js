import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { 
  createCourse, updateCourse, submitCourse, listPublic, getCourse, getCourseBySlug, patchMarketing
} from '../controllers/courseController.js';

export const courseRouter = Router();

// Público
courseRouter.get('/courses', listPublic);
courseRouter.get('/courses/slug/:slug', getCourseBySlug); // importante: antes de /:id para evitar colisiones
courseRouter.get('/courses/:id', optionalAuth, getCourse);

// Teacher
courseRouter.post('/courses', requireAuth, requireRole('teacher'), createCourse);
courseRouter.patch('/courses/:id', requireAuth, requireRole('teacher'), updateCourse);
courseRouter.patch('/courses/:id/marketing', requireAuth, requireRole('teacher'), patchMarketing);
courseRouter.post('/courses/:id/submit', requireAuth, requireRole('teacher'), submitCourse);
