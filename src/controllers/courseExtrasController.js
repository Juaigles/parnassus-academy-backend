import { finalQuizUpsertSchema, finalQuizAttemptSchema } from '../validators/courseExtrasSchemas.js';
import * as finalQuizService from '../services/finalQuizService.js';
import * as certificateService from '../services/certificateService.js';

export async function createFinalQuiz(req, res, next) {
  try {
    const dto = finalQuizUpsertSchema.parse({ 
      ...req.body, 
      courseId: req.params.courseId 
    });
    const out = await finalQuizService.createFinalQuiz({ 
      courseId: req.params.courseId,
      quizData: dto.quiz,
      teacherId: req.user.id 
    });
    res.status(201).json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function getFinalQuiz(req, res, next) {
  try {
    const out = await finalQuizService.getFinalQuizForStudent({ 
      courseId: req.params.courseId, 
      userId: req.user?.id 
    });
    res.json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function startFinalAttempt(req, res, next) {
  try {
    const out = await finalQuizService.startAttempt({ 
      courseId: req.params.courseId, 
      userId: req.user.id 
    });
    res.status(201).json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function submitFinalAttempt(req, res, next) {
  try {
    const dto = finalQuizAttemptSchema.parse(req.body);
    const out = await finalQuizService.submitAttempt({ 
      attemptId: dto.attemptId,
      answers: dto.answers,
      userId: req.user.id 
    });
    res.status(201).json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function getCertificate(req, res, next) {
  try {
    const certificate = await certificateService.getCertificateByUserCourse({ 
      userId: req.user.id, 
      courseId: req.params.courseId 
    });
    res.json(certificate);
  } catch (e) { 
    next(e); 
  }
}

export async function verifyCertificate(req, res, next) {
  try {
    const cert = await certificateService.verifyCertificate({ 
      code: req.params.code 
    });
    res.json(cert);
  } catch (e) { 
    next(e); 
  }
}

export async function listMyCertificates(req, res, next) {
  try {
    const list = await certificateService.listMyCertificates(req.user.id);
    res.json(list);
  } catch (e) { 
    next(e); 
  }
}
