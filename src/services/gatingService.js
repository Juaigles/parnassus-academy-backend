// src/services/gatingService.js
import AppError from '../libs/appError.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as purchaseService from '../services/purchaseService.js';

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
 * ---- Verificar acceso al curso (compra + gating) ----
 */
export async function canAccessCourse({ userId, courseId }) {
  // Obtener el usuario para verificar roles
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user) return { ok: false, reason: 'user_not_found' };
  
  // Verificar acceso por roles y compra
  const accessCheck = await purchaseService.canAccessCourse(user, courseId);
  
  if (!accessCheck.hasAccess) {
    return { ok: false, reason: accessCheck.reason };
  }
  
  return { ok: true, reason: accessCheck.reason };
}

/**
 * ---- Gating por lección: no puedes abrir L si la anterior no está completada ----
 */
export async function canAccessLesson({ userId, lessonId }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) return { ok: false, reason: 'lesson_not_found' };

  // Primero verificar acceso al curso
  const courseAccess = await canAccessCourse({ userId, courseId: lesson.course });
  if (!courseAccess.ok) {
    return { ok: false, reason: 'course_not_purchased' };
  }

  const courseId = lesson.course;
  const modLessons = await lessonRepo.listByModule(lesson.module);
  const ordered = modLessons.sort((a, b) => a.index - b.index);
  const idx = ordered.findIndex(l => String(l._id) === String(lessonId));
  if (idx === -1) return { ok: false, reason: 'lesson_not_in_module' };
  if (idx === 0) return { ok: true }; // primera del módulo

  const prev = ordered[idx - 1];
  const progress = await progressRepo.findOrCreate({ userId, courseId });
  const prevLessonProgress = progress.lessons.find(lp => String(lp.lessonId) === String(prev._id));
  
  if (!prevLessonProgress || !prevLessonProgress.completed) {
    return { ok: false, reason: 'previous_lesson_incomplete' };
  }

  return { ok: true };
}

/**
 * ---- Gating quiz de módulo: requiere todas las lecciones completadas ----
 */
export async function canStartModuleQuiz({ userId, moduleId }) {
  const moduleLessons = await lessonRepo.listByModule(moduleId);
  if (moduleLessons.length === 0) return { ok: false, reason: 'module_has_no_lessons' };

  const courseId = moduleLessons[0].course;
  
  // Verificar acceso al curso
  const courseAccess = await canAccessCourse({ userId, courseId });
  if (!courseAccess.ok) {
    return { ok: false, reason: 'course_not_purchased' };
  }

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
  // Verificar acceso al curso
  const courseAccess = await canAccessCourse({ userId, courseId });
  if (!courseAccess.ok) {
    return { ok: false, reason: 'course_not_purchased' };
  }

  const modules = await moduleRepo.listByCourse(courseId);
  if (modules.length === 0) return { ok: false, reason: 'course_has_no_modules' };

  const progress = await progressRepo.findOrCreate({ userId, courseId });

  const allModulesPassed = modules.every(m =>
    progress.completedModules.includes(String(m._id))
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


