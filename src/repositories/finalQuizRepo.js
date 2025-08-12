import CourseFinalQuiz from '../models/CourseFinalQuiz.js';
export const findByCourse = (courseId) => CourseFinalQuiz.findOne({ courseId });
export const upsertByCourse = (courseId, data, session) =>
  CourseFinalQuiz.findOneAndUpdate({ courseId }, data, { new: true, upsert: true, session });
export const deleteByCourse = (courseId, session) =>
  CourseFinalQuiz.findOneAndDelete({ courseId }, { session });
