// src/repositories/progressRepo.js
import Progress from '../models/Progress.js';

export function findOrCreate({ userId, courseId }) {
  return Progress.findOneAndUpdate(
    { userId, courseId },
    { $setOnInsert: { userId, courseId } },
    { upsert: true, new: true }
  );
}
export function findByUserCourse({ userId, courseId }) {
  return Progress.findOne({ userId, courseId });
}
export function save(progress) { return progress.save(); }
