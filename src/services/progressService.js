import * as progressRepo from '../repositories/progressRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';

export async function markLessonComplete({ userId, courseId, lessonId }) {
  // Obtener progreso actual
  const progress = await progressRepo.findOrCreate({ userId, courseId });
  
  // Añadir lección a completadas si no está ya
  if (!progress.completedLessons.includes(String(lessonId))) {
    progress.completedLessons.push(lessonId);
  }

  // Obtener la lección para saber a qué módulo pertenece
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new Error('Lesson not found');

  // Recalcular progreso del módulo
  await recalculateModuleProgress(progress, lesson.module);
  
  // Recalcular progreso del curso
  await recalculateCourseProgress(progress, courseId);
  
  // Guardar progreso actualizado
  progress.lastLesson = lessonId;
  return progressRepo.save(progress);
}

export async function getProgress({ userId, courseId }) {
  const progress = await progressRepo.findOrCreate({ userId, courseId });
  
  return {
    userId,
    courseId,
    coursePct: progress.coursePct,
    modulePctById: Object.fromEntries(progress.modulePctById),
    completedLessons: progress.completedLessons.length,
    completedModules: progress.completedModules.length,
    lastLesson: progress.lastLesson
  };
}

async function recalculateModuleProgress(progress, moduleId) {
  // Obtener todas las lecciones del módulo
  const moduleLessons = await lessonRepo.listByModule(moduleId);
  const totalLessons = moduleLessons.length;
  
  if (totalLessons === 0) return;
  
  // Contar lecciones completadas del módulo
  const completedInModule = moduleLessons.filter(lesson => 
    progress.completedLessons.includes(String(lesson._id))
  ).length;
  
  // Calcular porcentaje del módulo
  const modulePct = Math.round((completedInModule / totalLessons) * 100);
  progress.modulePctById.set(String(moduleId), modulePct);
  
  // Si el módulo está 100% completado, añadirlo a módulos completados
  if (modulePct === 100 && !progress.completedModules.includes(String(moduleId))) {
    progress.completedModules.push(moduleId);
  }
}

async function recalculateCourseProgress(progress, courseId) {
  // Obtener todas las lecciones del curso
  const allLessons = await lessonRepo.listByCourse(courseId);
  const totalLessons = allLessons.length;
  
  if (totalLessons === 0) {
    progress.coursePct = 0;
    return;
  }
  
  // Calcular porcentaje del curso
  const completedLessons = progress.completedLessons.length;
  progress.coursePct = Math.round((completedLessons / totalLessons) * 100);
}
