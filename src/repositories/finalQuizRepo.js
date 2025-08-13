import CourseFinalQuiz from '../models/CourseFinalQuiz.js';

export const create = (data) => CourseFinalQuiz.create(data);
export const findById = (id) => CourseFinalQuiz.findById(id);
export const findByCourse = (courseId) => CourseFinalQuiz.findOne({ course: courseId }).populate('quiz');
export const findByQuiz = (quizId) => CourseFinalQuiz.findOne({ quiz: quizId });
export const updateById = (id, update) => CourseFinalQuiz.findByIdAndUpdate(id, update, { new: true });
export const deleteById = (id) => CourseFinalQuiz.findByIdAndDelete(id);
export const deleteByCourse = (courseId) => CourseFinalQuiz.findOneAndDelete({ course: courseId });
