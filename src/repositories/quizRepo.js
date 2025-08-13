import Quiz from '../models/Quiz.js';

export const create = (data) => Quiz.create(data);
export const findById = (id) => Quiz.findById(id);
export const updateById = (id, update) => Quiz.findByIdAndUpdate(id, update, { new: true });
export const deleteById = (id) => Quiz.findByIdAndDelete(id);
