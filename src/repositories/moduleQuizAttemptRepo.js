import ModuleQuizAttempt from '../models/ModuleQuizAttempt.js';
export const countByUserAndQuiz = (userId, moduleQuizId) =>
  ModuleQuizAttempt.countDocuments({ userId, moduleQuizId });
export const create = (d) => ModuleQuizAttempt.create(d);
export const listMyAttempts = (userId, moduleId) =>
  ModuleQuizAttempt.find({ userId, moduleId }).sort({ createdAt: -1 }).lean();
export const anyPassedForUserModule = (userId, moduleId) =>
  ModuleQuizAttempt.exists({ userId, moduleId, passed: true });
