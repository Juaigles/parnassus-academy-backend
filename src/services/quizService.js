import * as courseRepo from '../repositories/courseRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as quizRepo from '../repositories/quizRepo.js';
import * as attemptRepo from '../repositories/attemptRepo.js';
import * as videoProgressService from './videoProgressService.js';
import { assertCanEditCourse, assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { isLessonUnlocked } from './gatingService.js';
import AppError from '../libs/appError.js';

export async function upsertLessonQuiz({ data, user }) {
  const lesson = await lessonRepo.findById(data.lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  if (String(lesson.courseId) !== String(data.courseId)) throw new AppError('Conflict', 409);
  assertCanEditCourse(course, user);

  const q = await quizRepo.upsertByLesson(lesson._id, {
    courseId: course._id,
    lessonId: lesson._id,
    passingScore: data.passingScore ?? 70,
    maxAttempts: data.maxAttempts ?? 3,
    questions: data.questions
  });

  // marca hasQuiz=true en la lección
  await lessonRepo.updateById(lesson._id, { hasQuiz: true });
  return q;
}

export async function deleteLessonQuiz({ lessonId, user }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  assertCanEditCourse(course, user);
  await quizRepo.deleteByLesson(lessonId);
  await lessonRepo.updateById(lessonId, { hasQuiz: false });
  return { ok: true };
}

export async function getLessonQuiz({ lessonId, viewer }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const [course] = await Promise.all([courseRepo.findById(lesson.courseId)]);
  assertCanViewCourse(course, viewer);
  if (!isAdmin(viewer) && !isOwner(viewer, course)) {
    const unlocked = await isLessonUnlocked({ user: viewer, course, module: { _id: lesson.moduleId, index: 0 }, lesson });
    if (!unlocked) throw new AppError('Locked', 423);
  }
  const q = await quizRepo.findByLesson(lessonId);
  if (!q) throw new AppError('Not found', 404, 'La lección no tiene quiz');

  // oculta soluciones
  return {
    _id: q._id,
    courseId: q.courseId,
    lessonId: q.lessonId,
    passingScore: q.passingScore,
    maxAttempts: q.maxAttempts,
    questions: q.questions.map(qq => ({ text: qq.text, options: qq.options.map(o => ({ text: o.text })) }))
  };
}

export async function submitLessonAttempt({ lessonId, userId, payload }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  assertCanViewCourse(course, { id: userId, roles: [] });

  const q = await quizRepo.findByLesson(lessonId);
  if (!q) throw new AppError('Not found', 404, 'La lección no tiene quiz');

  const used = await attemptRepo.countByUserAndQuiz(userId, q._id);
  if (used >= q.maxAttempts) throw new AppError('Max attempts reached', 403);

  let correct = 0;
  for (let i=0;i<q.questions.length;i++){
    const qu = q.questions[i];
    const ans = payload.answers.find(a => a.questionIndex === i);
    const correctIdx = qu.options.map((o, idx) => (o.isCorrect ? idx : -1)).filter(x => x>=0).sort((a,b)=>a-b);
    const selected  = (ans?.selectedIndexes || []).slice().sort((a,b)=>a-b);
    if (JSON.stringify(correctIdx) === JSON.stringify(selected)) correct++;
  }
  const score = Math.round((correct / q.questions.length) * 100);
  const passed = score >= q.passingScore;

  const doc = await attemptRepo.create({
    quizId: q._id, courseId: q.courseId, lessonId: q.lessonId, userId, answers: payload.answers, score, passed
  });

  await videoProgressService.applyQuizResult({ 
    userId, 
    courseId: q.courseId, 
    lessonId: q.lessonId, 
    quizType: 'lesson',
    score, 
    passed 
  });

  return { attemptId: doc._id, score, passed, attemptsLeft: Math.max(q.maxAttempts - (used + 1), 0) };
}

export function listMyLessonAttempts({ userId, lessonId }) {
  return quizRepo.findByLesson(lessonId).then(q => q ? attemptRepo.listMyAttempts(userId, q._id) : []);
}
