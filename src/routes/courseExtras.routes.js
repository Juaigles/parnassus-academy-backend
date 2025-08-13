import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { 
  createFinalQuiz, 
  getFinalQuiz, 
  startFinalAttempt, 
  submitFinalAttempt, 
  getCertificate,
  verifyCertificate 
} from '../controllers/courseExtrasController.js';
import {
  createFinalQuizSchema,
  getFinalQuizSchema,
  startFinalAttemptSchema,
  submitFinalAttemptSchema,
  getCertificateSchema,
  verifyCertificateSchema
} from '../validators/courseExtras.schemas.js';

export const courseExtrasRouter = Router();

// Final Quiz routes
courseExtrasRouter.post('/courses/:courseId/final-quiz', 
  requireAuth, 
  requireRole('teacher'), 
  validate(createFinalQuizSchema),
  createFinalQuiz
);

courseExtrasRouter.get('/courses/:courseId/final-quiz', 
  optionalAuth, 
  validate(getFinalQuizSchema),
  getFinalQuiz
);

courseExtrasRouter.post('/courses/:courseId/final-quiz/start', 
  requireAuth, 
  validate(startFinalAttemptSchema),
  startFinalAttempt
);

courseExtrasRouter.post('/courses/:courseId/final-quiz/submit', 
  requireAuth, 
  validate(submitFinalAttemptSchema),
  submitFinalAttempt
);

// Certificate routes
courseExtrasRouter.get('/courses/:courseId/certificate', 
  requireAuth, 
  validate(getCertificateSchema),
  getCertificate
);

courseExtrasRouter.get('/certificates/:serial/verify', 
  optionalAuth, 
  validate(verifyCertificateSchema),
  verifyCertificate
);
