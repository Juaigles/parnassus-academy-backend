import Certificate from '../models/Certificate.js';
export const create = (d) => Certificate.create(d);
export const findBySerial = (serial) => Certificate.findOne({ serial }).lean();
export const listByUser = (userId) => Certificate.find({ userId }).sort({ createdAt: -1 }).lean();
export const findByUserCourse = (userId, courseId) => Certificate.findOne({ userId, courseId });
