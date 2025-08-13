import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { recordVideo, markRead, markLessonComplete, getProgress, getLessonProgress } from '../controllers/progressController.js';

export const progressRouter = Router();

// Nuevas rutas principales
progressRouter.get('/courses/:courseId/progress', requireAuth, getProgress);
progressRouter.get('/lessons/:lessonId/progress', requireAuth, getLessonProgress);
progressRouter.post('/lessons/:lessonId/complete', requireAuth, markLessonComplete);

// Compatibilidad con rutas anteriores
progressRouter.post('/lessons/:lessonId/progress/video', requireAuth, recordVideo);
progressRouter.post('/lessons/:lessonId/progress/read', requireAuth, markRead);
