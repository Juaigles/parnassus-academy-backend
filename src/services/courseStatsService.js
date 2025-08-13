import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as finalQuizRepo from '../repositories/finalQuizRepo.js';
import * as courseRepo from '../repositories/courseRepo.js';

export async function recomputeCourseStats(courseId) {
  const modules = await moduleRepo.listByCourse(courseId);
  const totalModules = modules.length;
  
  const lessons = await lessonRepo.listByCourse(courseId);
  const totalLessons = lessons.length;
  const totalDurationSec = lessons.reduce((a, l) => a + (l.durationSec || 0), 0);
  
  // Verificar si hay quizzes
  let hasQuizzes = false;
  
  // Verificar quizzes de módulos
  for (const module of modules) {
    const moduleQuiz = await moduleQuizRepo.findByModule(module._id);
    if (moduleQuiz) {
      hasQuizzes = true;
      break;
    }
  }
  
  // Verificar quiz final si no se encontraron quizzes de módulos
  if (!hasQuizzes) {
    const finalQuiz = await finalQuizRepo.findByCourse(courseId);
    if (finalQuiz) {
      hasQuizzes = true;
    }
  }

  await courseRepo.updateById(courseId, {
    'stats.totalModules': totalModules,
    'stats.totalLessons': totalLessons,
    'stats.totalDurationSec': totalDurationSec,
    'stats.hasQuizzes': hasQuizzes,
    'stats.hasCertificate': true // Por defecto todos los cursos tienen certificado
  });
  
  return {
    totalModules,
    totalLessons,
    totalDurationSec,
    hasQuizzes,
    hasCertificate: true
  };
}
