import Module from '../models/Module.js';
export const create = (d)=> Module.create(d);
export const findById = (id)=> Module.findById(id);
export const updateById = (id, p)=> Module.findByIdAndUpdate(id, p, { new:true });
export const deleteById = (id)=> Module.findByIdAndDelete(id);
export const listByCourse = (courseId)=> Module.find({ courseId }).sort({ index:1 }).lean();
