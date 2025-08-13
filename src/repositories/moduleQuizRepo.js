import ModuleQuiz from '../models/ModuleQuiz.js';

export const create = (data) => ModuleQuiz.create(data);
export const findById = (id) => ModuleQuiz.findById(id);
export const findByModule = (moduleId) => ModuleQuiz.findOne({ module: moduleId }).populate('quiz');
export const updateById = (id, update) => ModuleQuiz.findByIdAndUpdate(id, update, { new: true });
export const deleteById = (id) => ModuleQuiz.findByIdAndDelete(id);
export const deleteByModule = (moduleId) => ModuleQuiz.findOneAndDelete({ module: moduleId });
