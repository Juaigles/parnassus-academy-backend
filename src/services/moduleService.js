import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import AppError from '../libs/appError.js';
import { assertCanEditCourse } from './_rules.js';

export async function createModule({ data, user }){
  const course = await courseRepo.findById(data.courseId);
  assertCanEditCourse(course, user);
  return moduleRepo.create(data);
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
