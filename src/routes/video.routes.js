import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { upsertVideo, getSignedUrl } from '../controllers/videoController.js';

export const videoRouter = Router();
videoRouter.post('/videos', requireAuth, requireRole('teacher'), upsertVideo);
videoRouter.get('/lessons/:lessonId/video-url', optionalAuth, getSignedUrl);
