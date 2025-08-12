import Progress from '../models/Progress.js';

export const findByUserLesson = (userId, lessonId) =>
  Progress.findOne({ userId, lessonId });

export const upsertProgress = (userId, courseId, lessonId, patch) =>
  Progress.findOneAndUpdate(
    { userId, lessonId },
    { $setOnInsert: { userId, courseId, lessonId, startedAt: new Date() }, $set: patch },
    { new: true, upsert: true }
  );

export const listByUserModule = (userId, moduleLessonIds) =>
  Progress.find({ userId, lessonId: { $in: moduleLessonIds } }).lean();

export const listByUserCourse = (userId, courseId) =>
  Progress.find({ userId, courseId }).lean();
