import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import mongoose from 'mongoose';
import AppError from '../libs/appError.js';
import { assertCanEditCourse } from './_rules.js';

export async function createModule({ data, user }){
  // Validar que courseId sea un ObjectId válido
  if (!data.courseId || !mongoose.Types.ObjectId.isValid(data.courseId)) {
    throw new AppError('ID de curso inválido', 400);
  }
  
  const course = await courseRepo.findById(data.courseId);
  if (!course) {
    throw new AppError('Curso no encontrado', 404);
  }
  
  assertCanEditCourse(course, user);
  
  // Mapear courseId a course para el modelo de Mongoose
  const moduleData = {
    ...data,
    course: data.courseId // El modelo Module espera 'course', no 'courseId'
  };
  delete moduleData.courseId; // Remover courseId para evitar conflictos
  
  return moduleRepo.create(moduleData);
}
export async function updateModule({ moduleId, patch, user }){
  const mod = await moduleRepo.findById(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const course = await courseRepo.findById(mod.courseId);
  assertCanEditCourse(course, user);
  return moduleRepo.updateById(moduleId, patch);
}
export async function deleteModule({ moduleId, user }){
  const mod = await moduleRepo.findById(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const course = await courseRepo.findById(mod.courseId);
  assertCanEditCourse(course, user);
  await moduleRepo.deleteById(moduleId);
  return { ok:true };
}
export const listByCourse = (courseId)=> moduleRepo.listByCourse(courseId);
