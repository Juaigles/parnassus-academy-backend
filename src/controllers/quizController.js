import { lessonQuizUpsertSchema, lessonQuizAttemptSchema } from '../validators/quizSchemas.js';
import * as quizService from '../services/quizService.js';

export async function upsertLessonQuiz(req,res,next){ try{ const dto=lessonQuizUpsertSchema.parse(req.body); const out=await quizService.upsertLessonQuiz({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function getLessonQuiz(req,res,next){ try{ const out=await quizService.getLessonQuiz({ lessonId:req.params.lessonId, viewer:req.user||null }); res.json(out);}catch(e){next(e);} }
export async function deleteLessonQuiz(req,res,next){ try{ const out=await quizService.deleteLessonQuiz({ lessonId:req.params.lessonId, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function submitLessonAttempt(req,res,next){ try{ const dto=lessonQuizAttemptSchema.parse(req.body); const out=await quizService.submitLessonAttempt({ lessonId:req.params.lessonId, userId:req.user.id, payload:dto }); res.status(201).json(out);}catch(e){next(e);} }
export async function listMyLessonAttempts(req,res,next){ try{ const out=await quizService.listMyLessonAttempts({ userId:req.user.id, lessonId:req.params.lessonId }); res.json(out);}catch(e){next(e);} }
