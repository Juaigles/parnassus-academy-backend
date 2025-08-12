import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { upsertModuleQuiz, getModuleQuiz, deleteModuleQuiz, submitModuleAttempt, listMyModuleAttempts } from '../controllers/moduleQuizController.js';

export const moduleQuizRouter = Router();
moduleQuizRouter.post('/modules/:moduleId/quiz', requireAuth, requireRole('teacher'), upsertModuleQuiz);
moduleQuizRouter.get('/modules/:moduleId/quiz', optionalAuth, getModuleQuiz);
moduleQuizRouter.delete('/modules/:moduleId/quiz', requireAuth, requireRole('teacher'), deleteModuleQuiz);

moduleQuizRouter.post('/modules/:moduleId/quiz/attempts', requireAuth, submitModuleAttempt);
moduleQuizRouter.get('/modules/:moduleId/quiz/attempts/my', requireAuth, listMyModuleAttempts);
