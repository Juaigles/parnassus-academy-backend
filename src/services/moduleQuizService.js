import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as moduleQuizAttemptRepo from '../repositories/moduleQuizAttemptRepo.js';
import AppError from '../libs/appError.js';
import { assertCanEditCourse, assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { canAttemptModuleQuiz, isModuleUnlocked } from './gatingService.js';

export async function upsertModuleQuiz({ data, user }) {
  const course = await courseRepo.findById(data.courseId);
  assertCanEditCourse(course, user);
  const mod = await moduleRepo.findById(data.moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  if (String(mod.courseId)!==String(data.courseId)) throw new AppError('Conflict', 409, 'module.courseId no coincide con courseId');
  return moduleQuizRepo.upsertByModule(mod._id, {
    courseId: course._id, moduleId: mod._id,
    passingScore: data.passingScore ?? 70, maxAttempts: data.maxAttempts ?? 3,
    questions: data.questions
  });
}

export async function deleteModuleQuiz({ moduleId, user }) {
  const mod = await moduleRepo.findById(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const course = await courseRepo.findById(mod.courseId);
  assertCanEditCourse(course, user);
  await moduleQuizRepo.deleteByModule(moduleId);
  return { ok: true };
}

export async function getModuleQuiz({ moduleId, viewer }) {
  const mod = await moduleRepo.findById(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const course = await courseRepo.findById(mod.courseId);
  assertCanViewCourse(course, viewer);
  if (!isAdmin(viewer) && !isOwner(viewer, course)) {
    const unlocked = await isModuleUnlocked({ user: viewer, course, module: mod });
    if (!unlocked) throw new AppError('Locked', 423, 'Módulo bloqueado por prerequisitos');
  }
  const q = await moduleQuizRepo.findByModule(moduleId);
  if (!q) throw new AppError('Not found', 404, 'Este módulo no tiene quiz');
  return {
    _id: q._id, courseId: q.courseId, moduleId: q.moduleId,
    passingScore: q.passingScore, maxAttempts: q.maxAttempts,
    questions: q.questions.map(qq => ({ text: qq.text, options: qq.options.map(o => ({ text: o.text })) }))
  };
}

export async function submitModuleAttempt({ moduleId, userId, payload }) {
  const mod = await moduleRepo.findById(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const course = await courseRepo.findById(mod.courseId);
  assertCanViewCourse(course, { id: userId, roles: [] });

  const q = await moduleQuizRepo.findByModule(moduleId);
  if (!q) throw new AppError('Not found', 404, 'Este módulo no tiene quiz');

  const unlocked = await isModuleUnlocked({ user:{ id:userId }, course, module:mod });
  if (!unlocked) throw new AppError('Locked', 423, 'Módulo bloqueado por prerequisitos');

  const allowAttempt = await canAttemptModuleQuiz({ userId, moduleId: mod._id });
  if (!allowAttempt) throw new AppError('Preconditions failed', 412, 'Debes completar todas las lecciones del módulo');

  const used = await moduleQuizAttemptRepo.countByUserAndQuiz(userId, q._id);
  if (used >= q.maxAttempts) throw new AppError('Max attempts reached', 403, 'Has alcanzado el máximo de intentos');

  let correct=0;
  for (let i=0;i<q.questions.length;i++){
    const qu=q.questions[i]; const ans=payload.answers.find(a=>a.questionIndex===i);
    const correctIdx=qu.options.map((o,idx)=>o.isCorrect?idx:-1).filter(x=>x>=0).sort((a,b)=>a-b);
    const selected=(ans?.selectedIndexes||[]).slice().sort((a,b)=>a-b);
    if (JSON.stringify(correctIdx)===JSON.stringify(selected)) correct++;
  }
  const score = Math.round((correct/q.questions.length)*100);
  const passed = score >= q.passingScore;

  const doc = await moduleQuizAttemptRepo.create({
    moduleQuizId: q._id, courseId: q.courseId, moduleId: q.moduleId, userId,
    answers: payload.answers, score, passed
  });

  return { attemptId: doc._id, score, passed, attemptsLeft: Math.max(q.maxAttempts - (used + 1), 0) };
}

export function listMyModuleAttempts({ userId, moduleId }) {
  return moduleQuizAttemptRepo.listMyAttempts(userId, moduleId);
}
