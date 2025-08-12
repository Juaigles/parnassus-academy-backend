import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as moduleQuizAttemptRepo from '../repositories/moduleQuizAttemptRepo.js';

function byIndex(a, b) { return (a.index ?? 0) - (b.index ?? 0); }

/** Módulo desbloqueado:
 * - Si existe quiz del módulo previo: exige quiz previo APROBADO.
 * - Si NO existe quiz del módulo previo: exige TODAS las lecciones del módulo previo completadas.
 */
export async function isModuleUnlocked({ user, course, module }) {
  if ((module.index ?? 0) === 0) return true;

  const modules = await moduleRepo.listByCourse(course._id);
  modules.sort(byIndex);
  const i = modules.findIndex(m => String(m._id) === String(module._id));
  if (i <= 0) return true;
  const prev = modules[i-1];

  const prevQuiz = await moduleQuizRepo.findByModule(prev._id);
  if (prevQuiz) {
    const passed = await moduleQuizAttemptRepo.anyPassedForUserModule(user?.id, prev._id);
    return !!passed;
  }
  const prevLessons = await lessonRepo.listByModule(prev._id);
  if (!prevLessons.length) return true;
  const progresses = await progressRepo.listByUserModule(user?.id, prevLessons.map(l => l._id));
  const byLesson = new Map(progresses.map(p => [String(p.lessonId), p]));
  return prevLessons.every(l => byLesson.get(String(l._id))?.lessonCompleted);
}

/** Lección desbloqueada: módulo desbloqueado + lección anterior completada. */
export async function isLessonUnlocked({ user, course, module, lesson }) {
  const moduleOk = await isModuleUnlocked({ user, course, module });
  if (!moduleOk) return false;

  if ((lesson.index ?? 0) === 0) return true;

  const lessons = await lessonRepo.listByModule(module._id);
  lessons.sort(byIndex);
  const i = lessons.findIndex(l => String(l._id) === String(lesson._id));
  if (i <= 0) return true;

  const prev = lessons[i-1];
  const prog = await progressRepo.findByUserLesson(user?.id, prev._id);
  return !!prog?.lessonCompleted;
}

export async function canAttemptModuleQuiz({ userId, moduleId }) {
  const lessons = await lessonRepo.listByModule(moduleId);
  if (!lessons.length) return false;
  const progresses = await progressRepo.listByUserModule(userId, lessons.map(l => l._id));
  const byLesson = new Map(progresses.map(p => [String(p.lessonId), p]));
  return lessons.every(l => byLesson.get(String(l._id))?.lessonCompleted);
}

/** Final del curso: todos los módulos aprobados (si tienen quiz) o todos los módulos con lecciones completas. */
export async function canAttemptFinalQuiz({ userId, courseId }) {
  const modules = await moduleRepo.listByCourse(courseId);
  if (!modules.length) return false;
  for (const m of modules) {
    const mQuiz = await moduleQuizRepo.findByModule(m._id);
    if (mQuiz) {
      const passed = await moduleQuizAttemptRepo.anyPassedForUserModule(userId, m._id);
      if (!passed) return false;
    } else {
      const lessons = await lessonRepo.listByModule(m._id);
      const progresses = await progressRepo.listByUserModule(userId, lessons.map(l => l._id));
      const byLesson = new Map(progresses.map(p => [String(p.lessonId), p]));
      if (!lessons.every(l => byLesson.get(String(l._id))?.lessonCompleted)) return false;
    }
  }
  return true;
}
