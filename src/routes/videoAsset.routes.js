import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { upsertVideo, getLessonVideoUrl, deleteLessonVideo } from '../controllers/videoAssetController.js';

export const videoAssetRouter = Router();

// Crear/Reemplazar vídeo (solo teacher/owner)
videoAssetRouter.post('/video-assets', requireAuth, requireRole('teacher'), upsertVideo);

// Obtener URL firmada de reproducción (requiere login; gating para alumnos)
videoAssetRouter.get('/lessons/:lessonId/video-url', requireAuth, getLessonVideoUrl);

// Eliminar vídeo de una lección (solo teacher/owner)
videoAssetRouter.delete('/lessons/:lessonId/video-asset', requireAuth, requireRole('teacher'), deleteLessonVideo);
