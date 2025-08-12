import Quiz from '../models/Quiz.js';
export const findByLesson = (lessonId) => Quiz.findOne({ lessonId });
export const findById = (id) => Quiz.findById(id);
export const upsertByLesson = (lessonId, data, session) =>
  Quiz.findOneAndUpdate({ lessonId }, data, { new: true, upsert: true, session });
export const deleteByLesson = (lessonId, session) =>
  Quiz.findOneAndDelete({ lessonId }, { session });
