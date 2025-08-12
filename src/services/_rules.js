import AppError from '../libs/appError.js';
export const LOCKED_STATES = ['submitted','approved','published'];
export function isOwner(user, course){ return !!user && String(course?.owner) === String(user?.id); }
export function isAdmin(user){ return !!user && Array.isArray(user.roles) && user.roles.includes('admin'); }
export function assertCanEditCourse(course, user){
  if (!course) throw new AppError('Course not found', 404, 'Curso no encontrado');
  if (!isOwner(user, course) && !isAdmin(user)) throw new AppError('Forbidden', 403, 'No eres owner ni admin');
  if (LOCKED_STATES.includes(course.status) && !isAdmin(user)) throw new AppError('Conflict', 409, 'Curso bloqueado por estado');
}
export function assertCanViewCourse(course, user){
  if (!course) throw new AppError('Course not found', 404);
  if (course.status==='published') return;
  if (isOwner(user, course) || isAdmin(user)) return;
  throw new AppError('Forbidden', 403, 'No tienes acceso a este recurso');
}
