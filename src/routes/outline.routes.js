import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.js';
import { getCourseOutline } from '../controllers/outlineController.js';

export const outlineRouter = Router();
outlineRouter.get('/courses/:courseId/outline', optionalAuth, getCourseOutline);
