import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as courseRepo from '../repositories/courseRepo.js';

export async function recomputeCourseStats(courseId) {
  const modules = await moduleRepo.listByCourse(courseId);
  const totalModules = modules.length;
  const moduleIds = modules.map(m => m._id);
  const lessons = moduleIds.length ? await lessonRepo.listByModuleIds(moduleIds) : [];
  const totalLessons = lessons.length;
  const totalDurationSec = lessons.reduce((a, l) => a + (l.durationSec || 0), 0);
  const hasQuizzes = lessons.some(l => l.hasQuiz === true);

  await courseRepo.updateById(courseId, {
    'stats.totalModules': totalModules,
    'stats.totalLessons': totalLessons,
    'stats.totalDurationSec': totalDurationSec,
    'stats.hasQuizzes': hasQuizzes
  });
}
