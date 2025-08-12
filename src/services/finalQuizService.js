import * as courseRepo from '../repositories/courseRepo.js';
import * as finalQuizRepo from '../repositories/finalQuizRepo.js';
import * as finalAttemptRepo from '../repositories/finalAttemptRepo.js';
import * as certificateService from './certificateService.js';
import { assertCanEditCourse, assertCanViewCourse } from './_rules.js';
import { canAttemptFinalQuiz } from './gatingService.js';
import AppError from '../libs/appError.js';

export async function upsertFinalQuiz({ data, user }) {
  const course = await courseRepo.findById(data.courseId);
  assertCanEditCourse(course, user);
  return finalQuizRepo.upsertByCourse(course._id, {
    courseId: course._id,
    passingScore: data.passingScore ?? 70,
    maxAttempts: data.maxAttempts ?? 3,
    questions: data.questions
  });
}

export async function getFinalQuiz({ courseId, viewer }) {
  const course = await courseRepo.findById(courseId);
  assertCanViewCourse(course, viewer);
  const q = await finalQuizRepo.findByCourse(courseId);
  if (!q) throw new AppError('Not found', 404, 'El curso no tiene examen final');
  // oculta soluciones
  return {
    _id: q._id, courseId: q.courseId, passingScore: q.passingScore, maxAttempts: q.maxAttempts,
    questions: q.questions.map(qq => ({ text: qq.text, options: qq.options.map(o => ({ text: o.text })) }))
  };
}

export async function submitFinalAttempt({ courseId, userId, payload }) {
  const course = await courseRepo.findById(courseId);
  assertCanViewCourse(course, { id: userId, roles: [] });

  const q = await finalQuizRepo.findByCourse(courseId);
  if (!q) throw new AppError('Not found', 404, 'El curso no tiene examen final');

  const allowed = await canAttemptFinalQuiz({ userId, courseId });
  if (!allowed) throw new AppError('Preconditions failed', 412, 'Debes cumplir los prerrequisitos');

  const used = await finalAttemptRepo.countByUserAndQuiz(userId, q._id);
  if (used >= q.maxAttempts) throw new AppError('Max attempts reached', 403, 'Has alcanzado el máximo de intentos');

  let correct = 0;
  for (let i=0;i<q.questions.length;i++){
    const qu=q.questions[i]; const ans=payload.answers.find(a=>a.questionIndex===i);
    const correctIdx=qu.options.map((o,idx)=>o.isCorrect?idx:-1).filter(x=>x>=0).sort((a,b)=>a-b);
    const selected=(ans?.selectedIndexes||[]).slice().sort((a,b)=>a-b);
    if (JSON.stringify(correctIdx)===JSON.stringify(selected)) correct++;
  }
  const score = Math.round((correct/q.questions.length)*100);
  const passed = score >= q.passingScore;

  const doc = await finalAttemptRepo.create({
    finalQuizId: q._id, courseId: q.courseId, userId, answers: payload.answers, score, passed
  });

  let certificateSerial = null;
  if (passed) {
    const cert = await certificateService.issueIfNotExists({ userId, courseId: q.courseId });
    certificateSerial = cert.serial;
  }
  return { attemptId: doc._id, score, passed, attemptsLeft: Math.max(q.maxAttempts - (used + 1), 0), certificateSerial };
}
