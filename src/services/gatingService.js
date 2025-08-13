// src/services/gatingService.js
import AppError from '../libs/appError.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';

/**
 * ---- Edición de curso (para crear/editar/borrar módulos, lecciones, assets, quizzes, etc.) ----
 * Regla:
 *  - Admin: puede editar siempre.
 *  - Owner (teacher): puede editar si el curso NO está 'approved' ni 'published'.
 *  - Resto: 403.
 */
export function canEditCourse(course, user) {
  const isAdmin = user?.roles?.includes('admin');
  const isOwner = user && String(course.owner) === String(user.id);

  if (isAdmin) return { ok: true };
  if (!isOwner) return { ok: false, code: 'forbidden', http: 403 };

  if (['approved', 'published'].includes(course.status)) {
    return { ok: false, code: 'course_locked', http: 409 };
  }
  return { ok: true };
}

export function assertCanEditCourse(course, user) {
  const res = canEditCourse(course, user);
  if (!res.ok) {
    if (res.code === 'course_locked') {
      throw new AppError('Course is locked for editing', res.http || 409);
    }
    throw new AppError('Forbidden', res.http || 403);
  }
}

/**
 * ---- Gating por lección: no puedes abrir L si la anterior no está completada ----
 */
export async function canAccessLesson({ userId, lessonId }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) return { ok: false, reason: 'lesson_not_found' };

  const courseId = lesson.courseId;
  const modLessons = await lessonRepo.listByModule(lesson.moduleId);
  const ordered = modLessons.sort((a, b) => a.index - b.index);
  const idx = ordered.findIndex(l => String(l._id) === String(lessonId));
  if (idx === -1) return { ok: false, reason: 'lesson_not_in_module' };
  if (idx === 0) return { ok: true }; // primera del módulo

  const prev = ordered[idx - 1];
  const progress = await progressRepo.findOrCreate({ userId, courseId });
  const prevLp = progress.lessons.find(lp => String(lp.lessonId) === String(prev._id));
  if (!prevLp || !prevLp.completed) return { ok: false, reason: 'previous_lesson_incomplete' };

  return { ok: true };
}

/**
 * ---- Gating quiz de módulo: requiere todas las lecciones completadas ----
 */
export async function canStartModuleQuiz({ userId, moduleId }) {
  const moduleLessons = await lessonRepo.listByModule(moduleId);
  if (moduleLessons.length === 0) return { ok: false, reason: 'module_has_no_lessons' };

  const courseId = moduleLessons[0].courseId;
  const progress = await progressRepo.findOrCreate({ userId, courseId });

  const allDone = moduleLessons.every(l =>
    progress.lessons.find(lp => String(lp.lessonId) === String(l._id))?.completed
  );
  if (!allDone) return { ok: false, reason: 'not_all_lessons_completed' };

  return { ok: true };
}

/**
 * ---- Gating quiz final: requiere todos los módulos aprobados ----
 */
export async function canStartFinalQuiz({ userId, courseId }) {
  const modules = await moduleRepo.listByCourse(courseId);
  if (modules.length === 0) return { ok: false, reason: 'course_has_no_modules' };

  const progress = await progressRepo.findOrCreate({ userId, courseId });

  const allModulesPassed = modules.every(m =>
    progress.modules.find(mr => String(mr.moduleId) === String(m._id))?.passed
  );
  if (!allModulesPassed) return { ok: false, reason: 'not_all_modules_passed' };

  return { ok: true };
}

// --- Backwards-compat shims (nombres antiguos que aún importan otros servicios) ---

// Antes: isLessonUnlocked(...) -> boolean
export async function isLessonUnlocked(params) {
  const r = await canAccessLesson(params);  // API nueva
  return !!r.ok;
}

// Antes: isModuleQuizAvailable(...) -> boolean
export async function isModuleQuizAvailable(params) {
  const r = await canStartModuleQuiz(params); // API nueva
  return !!r.ok;
}

// Antes: isFinalQuizAvailable(...) -> boolean
export async function isFinalQuizAvailable(params) {
  const r = await canStartFinalQuiz(params); // API nueva
  return !!r.ok;
}

// Algunos servicios usan este nombre antiguo:
export async function canAttemptModuleQuiz(params) {
  const r = await canStartModuleQuiz(params); // API nueva
  return !!r.ok;
}

// Algunos sitios comprueban si el módulo está “desbloqueado”
// (hacemos una versión estricta: true solo cuando ya se podría empezar el quiz del módulo)
export async function isModuleUnlocked(params) {
  const r = await canStartModuleQuiz(params);
  return !!r.ok;
}

// Por si algún servicio usa este alias para el final:
export async function canAttemptFinalQuiz(params) {
  const r = await canStartFinalQuiz(params);
  return !!r.ok;
}


