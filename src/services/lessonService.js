import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import mongoose from 'mongoose';
import AppError from '../libs/appError.js';
import { assertCanEditCourse, assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { isLessonUnlocked } from './gatingService.js';

export async function createLesson({ data, user }){
  // Validar que courseId y moduleId sean ObjectIds válidos
  if (!data.courseId || !mongoose.Types.ObjectId.isValid(data.courseId)) {
    throw new AppError('ID de curso inválido', 400);
  }
  if (!data.moduleId || !mongoose.Types.ObjectId.isValid(data.moduleId)) {
    throw new AppError('ID de módulo inválido', 400);
  }
  
  const course = await courseRepo.findById(data.courseId);
  if (!course) {
    throw new AppError('Curso no encontrado', 404);
  }
  
  assertCanEditCourse(course, user);
  
  const mod = await moduleRepo.findById(data.moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  if (String(mod.course)!==String(data.courseId)) throw new AppError('Conflict', 409, 'module.courseId no coincide');
  
  // Mapear los campos para el modelo de Mongoose
  const lessonData = {
    ...data,
    course: data.courseId, // El modelo Lesson espera 'course', no 'courseId'
    module: data.moduleId  // El modelo Lesson espera 'module', no 'moduleId'
  };
  
  // Eliminar campos de API que no debe tener el modelo
  delete lessonData.courseId;
  delete lessonData.moduleId;
  
  // Mapear contentHtml si viene como content
  if (lessonData.content && !lessonData.contentHtml) {
    lessonData.contentHtml = lessonData.content;
    delete lessonData.content;
  }
  
  // Generar slug automáticamente si no se proporciona
  if (!lessonData.slug) {
    const timestamp = Date.now();
    const titleSlug = lessonData.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .substring(0, 50); // Limitar longitud
    lessonData.slug = `${titleSlug}-${timestamp}`;
  }
  
  // Normalizar recursos: kind → type
  if (lessonData.resources && Array.isArray(lessonData.resources)) {
    lessonData.resources = lessonData.resources.map(resource => ({
      ...resource,
      type: resource.kind || resource.type, // Priorizar kind, fallback a type
    }));
    // Remover el campo kind para evitar conflictos
    lessonData.resources.forEach(resource => delete resource.kind);
  }
  
  return lessonRepo.create(lessonData);
}
export async function updateLesson({ lessonId, patch, user }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.course);
  assertCanEditCourse(course, user);
  return lessonRepo.updateById(lessonId, patch);
}
export async function deleteLesson({ lessonId, user }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.course);
  assertCanEditCourse(course, user);
  await lessonRepo.deleteById(lessonId);
  return { ok:true };
}
export async function getLessonForViewer({ lessonId, viewer }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const [course, mod] = await Promise.all([courseRepo.findById(lesson.course), moduleRepo.findById(lesson.module)]);
  assertCanViewCourse(course, viewer);
  if (!isAdmin(viewer) && !isOwner(viewer, course)){
    const unlocked = await isLessonUnlocked({ user: viewer, course, module: mod, lesson });
    if (!unlocked) throw new AppError('Locked', 423, 'Lección bloqueada por prerequisitos');
  }
  return lesson;
}
export const listByModule = (moduleId)=> lessonRepo.listByModule(moduleId);
