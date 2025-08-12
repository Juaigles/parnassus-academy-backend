import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import AppError from '../libs/appError.js';
import { assertCanEditCourse, assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { isLessonUnlocked } from './gatingService.js';

export async function createLesson({ data, user }){
  const course = await courseRepo.findById(data.courseId);
  assertCanEditCourse(course, user);
  const mod = await moduleRepo.findById(data.moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  if (String(mod.courseId)!==String(data.courseId)) throw new AppError('Conflict', 409, 'module.courseId no coincide');
  return lessonRepo.create(data);
}
export async function updateLesson({ lessonId, patch, user }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  assertCanEditCourse(course, user);
  return lessonRepo.updateById(lessonId, patch);
}
export async function deleteLesson({ lessonId, user }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  assertCanEditCourse(course, user);
  await lessonRepo.deleteById(lessonId);
  return { ok:true };
}
export async function getLessonForViewer({ lessonId, viewer }){
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const [course, mod] = await Promise.all([courseRepo.findById(lesson.courseId), moduleRepo.findById(lesson.moduleId)]);
  assertCanViewCourse(course, viewer);
  if (!isAdmin(viewer) && !isOwner(viewer, course)){
    const unlocked = await isLessonUnlocked({ user: viewer, course, module: mod, lesson });
    if (!unlocked) throw new AppError('Locked', 423, 'Lección bloqueada por prerequisitos');
  }
  return lesson;
}
export const listByModule = (moduleId)=> lessonRepo.listByModule(moduleId);
