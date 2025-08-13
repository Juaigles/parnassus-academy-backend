import Lesson from '../models/Lesson.js';

export const create = (d) => Lesson.create(d);
export const findById = (id) => Lesson.findById(id);
export const updateById = (id, p) => Lesson.findByIdAndUpdate(id, p, { new: true });
export const deleteById = (id) => Lesson.findByIdAndDelete(id);
export const listByModule = (moduleId) => Lesson.find({ module: moduleId }).sort({ index: 1 }).lean();
export const listByModuleIds = (moduleIds) => Lesson.find({ module: { $in: moduleIds } }).lean();
export const listByCourse = (courseId) => Lesson.find({ course: courseId }).sort({ module: 1, index: 1 }).lean();
