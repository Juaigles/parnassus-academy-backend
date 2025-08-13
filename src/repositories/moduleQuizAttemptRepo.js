import ModuleQuizAttempt from '../models/ModuleQuizAttempt.js';

export const create = (data) => ModuleQuizAttempt.create(data);
export const findById = (id) => ModuleQuizAttempt.findById(id);
export const countByUserAndQuiz = (userId, moduleQuizId) => ModuleQuizAttempt.countDocuments({ user: userId, moduleQuiz: moduleQuizId });
export const listByUserAndModule = (userId, moduleId) => ModuleQuizAttempt.find({ user: userId, moduleQuiz: moduleId }).sort({ createdAt: -1 }).lean();
export const findBestAttemptByUserAndModule = (userId, moduleId) => ModuleQuizAttempt.findOne({ user: userId, moduleQuiz: moduleId }).populate('attempt').sort({ 'attempt.scorePct': -1 }).lean();
