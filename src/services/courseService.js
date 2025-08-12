import * as courseRepo from '../repositories/courseRepo.js';
import * as approvalRepo from '../repositories/approvalRepo.js';
import AppError from '../libs/appError.js';

export async function createCourse({ data, ownerId }) {
  return courseRepo.create({ ...data, owner: ownerId, status: 'draft' });
}
export async function updateCourse({ courseId, ownerId, patch }) {
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (String(course.owner)!==String(ownerId)) throw new AppError('Forbidden', 403);
  if (['approved','published'].includes(course.status)) throw new AppError('Conflict', 409);
  Object.assign(course, patch);
  return course.save();
}
export const listPublic = ({ limit, skip })=> courseRepo.listPublic({ limit, skip });

export async function submitForApproval({ courseId, ownerId, notes }){
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (String(course.owner)!==String(ownerId)) throw new AppError('Forbidden', 403);
  if (course.status!=='draft') throw new AppError('Conflict', 409, 'Solo cursos en borrador pueden enviarse');
  course.status = 'submitted'; await course.save();
  await approvalRepo.createPending({ courseId: course._id, submittedBy: ownerId, notes });
  return { status: course.status };
}
export async function getCourseForViewer({ courseId, viewer }){
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  const isOwner = viewer && String(course.owner)===String(viewer.id);
  const isAdmin = viewer?.roles?.includes('admin');
  if (course.status!=='published' && !isOwner && !isAdmin) throw new AppError('Forbidden', 403);
  return course;
}
