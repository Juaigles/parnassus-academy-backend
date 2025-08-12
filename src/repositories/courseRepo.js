import Course from '../models/Course.js';
export const create = (d)=> Course.create(d);
export const findById = (id)=> Course.findById(id);
export const updateById = (id, patch)=> Course.findByIdAndUpdate(id, patch, { new:true });
export function listPublic({ limit=20, skip=0 }={}) {
  return Course.find({ status:'published', visibility:'public' }).sort('-createdAt').skip(skip).limit(limit).lean();
}
