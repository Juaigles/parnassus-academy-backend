import Progress from '../models/Progress.js';

export const findOrCreate = async ({ userId, courseId }) => {
  return Progress.findOneAndUpdate(
    { user: userId, course: courseId },
    { $setOnInsert: { user: userId, course: courseId, lessons: [], modules: [] } },
    { upsert: true, new: true }
  );
};

export const findByUserCourse = ({ userId, courseId }) => {
  return Progress.findOne({ user: userId, course: courseId });
};

export const findByUserLesson = async (userId, lessonId) => {
  const progress = await Progress.findOne(
    { 'lessons.lessonId': lessonId, user: userId },
    { 'lessons.$': 1, user: 1, course: 1 }
  );
  return progress?.lessons?.[0] || null;
};

export const upsertProgress = async (userId, courseId, lessonId, updateData) => {
  return Progress.findOneAndUpdate(
    { user: userId, course: courseId },
    { 
      $set: {
        'lessons.$[elem]': { 
          lessonId, 
          ...updateData
        },
        lastLesson: lessonId,
        updatedAt: new Date()
      }
    },
    { 
      arrayFilters: [{ 'elem.lessonId': lessonId }],
      upsert: true, 
      new: true 
    }
  ).catch(async () => {
    // Si no existe la lección en el array, la añadimos
    return Progress.findOneAndUpdate(
      { user: userId, course: courseId },
      { 
        $push: { 
          lessons: { lessonId, ...updateData } 
        },
        $set: {
          lastLesson: lessonId,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
  });
};

export const listByUserCourse = (userId, courseId) => {
  return Progress.findOne({ user: userId, course: courseId })
    .populate('lessons.lessonId', 'title index module')
    .lean();
};

export const updateProgress = async ({ userId, courseId, update }) => {
  return Progress.findOneAndUpdate(
    { user: userId, course: courseId },
    { $set: update },
    { new: true, upsert: true }
  );
};

export const save = (progress) => progress.save();
