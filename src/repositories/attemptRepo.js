import Attempt from '../models/Attempt.js';

export const create = (data) => Attempt.create(data);
export const findById = (id) => Attempt.findById(id);
export const updateById = (id, update) => Attempt.findByIdAndUpdate(id, update, { new: true });
export const countByUserAndQuiz = (userId, quizId) => Attempt.countDocuments({ user: userId, quiz: quizId });
export const listByUserAndQuiz = (userId, quizId) => Attempt.find({ user: userId, quiz: quizId }).sort({ createdAt: -1 }).lean();
export const findBestAttemptByUserAndQuiz = (userId, quizId) => Attempt.findOne({ user: userId, quiz: quizId }).sort({ scorePct: -1 }).lean();
