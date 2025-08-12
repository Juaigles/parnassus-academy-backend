import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { upsertLessonQuiz, getLessonQuiz, deleteLessonQuiz, submitLessonAttempt, listMyLessonAttempts } from '../controllers/quizController.js';

export const quizRouter = Router();
quizRouter.post('/lessons/:lessonId/quiz', requireAuth, requireRole('teacher'), upsertLessonQuiz);
quizRouter.get('/lessons/:lessonId/quiz', optionalAuth, getLessonQuiz);
quizRouter.delete('/lessons/:lessonId/quiz', requireAuth, requireRole('teacher'), deleteLessonQuiz);

quizRouter.post('/lessons/:lessonId/quiz/attempts', requireAuth, submitLessonAttempt);
quizRouter.get('/lessons/:lessonId/quiz/attempts/my', requireAuth, listMyLessonAttempts);
