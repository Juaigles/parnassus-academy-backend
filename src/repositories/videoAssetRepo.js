import VideoAsset from '../models/VideoAsset.js';

export const findByLesson = (lessonId) =>
  VideoAsset.findOne({ lessonId });

export const upsertByLesson = (lessonId, data, session) =>
  VideoAsset.findOneAndUpdate(
    { lessonId },
    { $set: data },
    { new: true, upsert: true, session }
  );

export const deleteByLesson = (lessonId, session) =>
  VideoAsset.findOneAndDelete({ lessonId }, { session });
