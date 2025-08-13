import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { createLesson, updateLesson, deleteLesson, getLesson, listLessonsByModule } from '../controllers/lessonController.js';

export const lessonRouter = Router();
lessonRouter.get('/modules/:moduleId/lessons', optionalAuth, listLessonsByModule);
lessonRouter.get('/lessons/:id', optionalAuth, getLesson);
lessonRouter.post('/lessons', requireAuth, requireRole('teacher'), createLesson);
// Ruta anidada para crear lecciones por curso y módulo
lessonRouter.post('/courses/:courseId/modules/:moduleId/lessons', requireAuth, requireRole('teacher'), createLesson);
lessonRouter.patch('/lessons/:id', requireAuth, requireRole('teacher'), updateLesson);
lessonRouter.delete('/lessons/:id', requireAuth, requireRole('teacher'), deleteLesson);
