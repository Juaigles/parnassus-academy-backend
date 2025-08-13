import Certificate from '../models/Certificate.js';

export const create = (data) => Certificate.create(data);
export const findById = (id) => Certificate.findById(id);
export const findByCode = (code) => Certificate.findOne({ code }).lean();
export const findByUserCourse = (userId, courseId) => Certificate.findOne({ user: userId, course: courseId });
export const listByUser = (userId) => Certificate.find({ user: userId }).sort({ createdAt: -1 }).lean();
