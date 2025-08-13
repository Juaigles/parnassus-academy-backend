import CourseFinalAttempt from '../models/CourseFinalAttempt.js';

export const create = (data) => CourseFinalAttempt.create(data);
export const findById = (id) => CourseFinalAttempt.findById(id);
export const countByUserAndQuiz = (userId, finalQuizId) => CourseFinalAttempt.countDocuments({ user: userId, finalQuiz: finalQuizId });
export const listByUserAndCourse = (userId, courseId) => CourseFinalAttempt.find({ user: userId, finalQuiz: courseId }).sort({ createdAt: -1 }).lean();
export const findBestAttemptByUserAndCourse = (userId, courseId) => CourseFinalAttempt.findOne({ user: userId, finalQuiz: courseId }).populate('attempt').sort({ 'attempt.scorePct': -1 }).lean();
