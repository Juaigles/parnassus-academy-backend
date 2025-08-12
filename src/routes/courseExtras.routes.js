import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { upsertFinalQuiz, getFinalQuiz, submitFinalAttempt, verifyCertificate, listMyCertificates, downloadCertificate } from '../controllers/courseExtrasController.js';

export const courseExtrasRouter = Router();
courseExtrasRouter.post('/courses/:courseId/final-quiz', requireAuth, requireRole('teacher'), upsertFinalQuiz);
courseExtrasRouter.get('/courses/:courseId/final-quiz', optionalAuth, getFinalQuiz);
courseExtrasRouter.post('/courses/:courseId/final-quiz/attempts', requireAuth, submitFinalAttempt);

courseExtrasRouter.get('/certificates/:serial', optionalAuth, verifyCertificate);
courseExtrasRouter.get('/me/certificates', requireAuth, listMyCertificates);
courseExtrasRouter.get('/certificates/:serial/download', requireAuth, downloadCertificate);
