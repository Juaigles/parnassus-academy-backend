import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { recordVideo, markRead } from '../controllers/progressController.js';

export const progressRouter = Router();
progressRouter.post('/lessons/:lessonId/progress/video', requireAuth, recordVideo);
progressRouter.post('/lessons/:lessonId/progress/read', requireAuth, markRead);
