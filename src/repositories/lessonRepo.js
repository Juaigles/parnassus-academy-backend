import Lesson from '../models/Lesson.js';
export const create = (d)=> Lesson.create(d);
export const findById = (id)=> Lesson.findById(id);
export const updateById = (id,p)=> Lesson.findByIdAndUpdate(id,p,{ new:true });
export const deleteById = (id)=> Lesson.findByIdAndDelete(id);
export const listByModule = (moduleId)=> Lesson.find({ moduleId }).sort({ index:1 }).lean();
export const listByCourse = (courseId)=> Lesson.find({ courseId }).sort({ moduleId:1, index:1 }).lean();
export function updateHasQuiz(lessonId, hasQuiz, session){ return Lesson.updateOne({ _id:lessonId }, { $set:{ hasQuiz } }, { session }); }
