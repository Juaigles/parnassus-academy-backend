import Attempt from '../models/Attempt.js';
export const countByUserAndQuiz = (userId, quizId) =>
  Attempt.countDocuments({ userId, quizId });
export const create = (d) => Attempt.create(d);
export const listMyAttempts = (userId, quizId) =>
  Attempt.find({ userId, quizId }).sort({ createdAt: -1 }).lean();
