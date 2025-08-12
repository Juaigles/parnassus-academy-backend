import ModuleQuiz from '../models/ModuleQuiz.js';
export const findByModule = (moduleId) => ModuleQuiz.findOne({ moduleId });
export const upsertByModule = (moduleId, data, session) =>
  ModuleQuiz.findOneAndUpdate({ moduleId }, data, { new: true, upsert: true, session });
export const deleteByModule = (moduleId, session) =>
  ModuleQuiz.findOneAndDelete({ moduleId }, { session });
