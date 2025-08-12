import CourseFinalAttempt from '../models/CourseFinalAttempt.js';
export const countByUserAndQuiz = (userId, finalQuizId) =>
  CourseFinalAttempt.countDocuments({ userId, finalQuizId });
export const create = (d) => CourseFinalAttempt.create(d);
export const listMyAttempts = (userId, finalQuizId) =>
  CourseFinalAttempt.find({ userId, finalQuizId }).sort({ createdAt: -1 }).lean();
export const anyPassedForUserCourse = (userId, courseId) =>
  CourseFinalAttempt.exists({ userId, courseId, passed: true });
