import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as finalQuizRepo from '../repositories/finalQuizRepo.js';
import * as gatingService from './gatingService.js';
import AppError from '../libs/appError.js';

export async function getOutlineForViewer({ courseId, viewer }) {
  const [modules, progress] = await Promise.all([
    moduleRepo.listByCourse(courseId),
    viewer ? progressRepo.findOrCreate({ userId: viewer.id, courseId }) : Promise.resolve(null)
  ]);

  const outline = [];
  let nextLesson = null;

  for (const module of modules.sort((a, b) => a.index - b.index)) {
    const lessons = await lessonRepo.listByModule(module._id);
    lessons.sort((a, b) => a.index - b.index);
    
    // Verificar si hay quiz para este módulo
    const moduleQuiz = await moduleQuizRepo.findByModule(module._id);
    const moduleCompleted = progress?.completedModules.includes(String(module._id)) || false;
    
    const lessonItems = [];
    for (const lesson of lessons) {
      const unlocked = viewer ? 
        (await gatingService.canAccessLesson({ userId: viewer.id, lessonId: lesson._id })).ok : 
        false;
      const completed = progress?.completedLessons.includes(String(lesson._id)) || false;
      
      if (!nextLesson && unlocked && !completed) {
        nextLesson = { moduleId: module._id, lessonId: lesson._id };
      }
      
      lessonItems.push({
        id: lesson._id,
        title: lesson.title,
        index: lesson.index,
        durationSec: lesson.durationSec,
        unlocked,
        completed
      });
    }
    
    // Calcular porcentaje del módulo
    const totalLessons = lessonItems.length;
    const completedLessons = lessonItems.filter(l => l.completed).length;
    const modulePercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Verificar si puede acceder al quiz del módulo
    const canAccessQuiz = viewer && moduleQuiz ? 
      (await gatingService.canStartModuleQuiz({ userId: viewer.id, moduleId: module._id })).ok : 
      false;
    
    outline.push({
      id: module._id,
      title: module.title,
      index: module.index,
      description: module.description,
      percent: modulePercent,
      completed: moduleCompleted,
      required: module.required,
      quiz: moduleQuiz ? {
        id: moduleQuiz._id,
        available: canAccessQuiz,
        passed: moduleCompleted
      } : null,
      lessons: lessonItems
    });
  }
  
  // Calcular progreso total del curso
  const totalLessons = outline.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = progress?.completedLessons.length || 0;
  const coursePercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Verificar acceso al quiz final
  const finalQuiz = await finalQuizRepo.findByCourse(courseId);
  const canAccessFinalQuiz = viewer && finalQuiz ? 
    (await gatingService.canStartFinalQuiz({ userId: viewer.id, courseId })).ok : 
    false;

  return {
    courseId,
    coursePct: coursePercent,
    modules: outline,
    nextUp: nextLesson,
    finalQuiz: finalQuiz ? {
      id: finalQuiz._id,
      available: canAccessFinalQuiz
    } : null
  };
}
