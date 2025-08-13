// src/services/videoProgressService.js
import * as progressRepo from '../repositories/progressRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as courseStatsService from './courseStatsService.js';
import { env } from '../config/env.js';

const VIDEO_COMPLETION_THRESHOLD = Number(env.VIDEO_COMPLETION_THRESHOLD || 0.9); // 90%

/**
 * Registra el progreso de visualización de un video
 */
export async function recordVideoProgress({ 
  userId, 
  courseId, 
  lessonId, 
  currentPositionSec, 
  watchedSeconds = 0 
}) {
  // Obtener la lección para validar la duración
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  // Calcular el porcentaje de progreso
  const totalDuration = lesson.durationSec || 1;
  const percentWatched = Math.min(currentPositionSec / totalDuration, 1);
  
  // Obtener progreso existente de esta lección
  const existingProgress = await progressRepo.findByUserLesson(userId, lessonId);
  
  // Calcular nuevo progreso máximo (nunca retrocede)
  const newPercentMax = Math.max(
    existingProgress?.video?.percentMax || 0, 
    percentWatched
  );
  
  // Verificar si el video se considera completado
  const videoCompleted = newPercentMax >= VIDEO_COMPLETION_THRESHOLD;
  
  // Verificar si la lección tiene quiz
  const hasQuiz = lesson.hasQuiz || false;
  
  // La lección está completada si:
  // - El video está completado Y
  // - (No tiene quiz O el quiz está aprobado)
  const quizPassed = existingProgress?.quiz?.passed || false;
  const lessonCompleted = videoCompleted && (!hasQuiz || quizPassed);
  
  // Preparar datos de actualización
  const updateData = {
    video: {
      percentMax: newPercentMax,
      lastPositionSec: currentPositionSec,
      secondsWatched: (existingProgress?.video?.secondsWatched || 0) + Math.max(watchedSeconds, 0),
      completed: videoCompleted
    },
    completed: lessonCompleted,
    completedAt: lessonCompleted && !existingProgress?.completed ? new Date() : existingProgress?.completedAt
  };

  // Preservar progreso de quiz existente
  if (existingProgress?.quiz) {
    updateData.quiz = existingProgress.quiz;
  }

  // Actualizar progreso
  const updatedProgress = await progressRepo.upsertProgress(userId, courseId, lessonId, updateData);
  
  // Recalcular estadísticas del curso si la lección se completó
  if (lessonCompleted && !existingProgress?.completed) {
    await courseStatsService.recomputeCourseStats(courseId);
  }

  return {
    percentWatched: Math.round(newPercentMax * 100),
    videoCompleted,
    lessonCompleted,
    needsQuiz: hasQuiz && videoCompleted && !quizPassed
  };
}

/**
 * Marca una lección como leída (para lecciones sin video)
 */
export async function markLessonAsRead({ userId, courseId, lessonId }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const existingProgress = await progressRepo.findByUserLesson(userId, lessonId);
  const hasQuiz = lesson.hasQuiz || false;
  const quizPassed = existingProgress?.quiz?.passed || false;
  
  // Para lecciones sin video, se considera completada si no tiene quiz o el quiz está aprobado
  const lessonCompleted = !hasQuiz || quizPassed;

  const updateData = {
    video: {
      percentMax: 1,
      lastPositionSec: 0,
      secondsWatched: 0,
      completed: true
    },
    completed: lessonCompleted,
    completedAt: lessonCompleted && !existingProgress?.completed ? new Date() : existingProgress?.completedAt
  };

  // Preservar progreso de quiz existente
  if (existingProgress?.quiz) {
    updateData.quiz = existingProgress.quiz;
  }

  const updatedProgress = await progressRepo.upsertProgress(userId, courseId, lessonId, updateData);

  if (lessonCompleted && !existingProgress?.completed) {
    await courseStatsService.recomputeCourseStats(courseId);
  }

  return {
    percentWatched: 100,
    videoCompleted: true,
    lessonCompleted,
    needsQuiz: hasQuiz && !quizPassed
  };
}

/**
 * Aplica el resultado de un quiz de lección al progreso
 */
export async function applyQuizResult({ userId, courseId, lessonId, score, passed }) {
  const existingProgress = await progressRepo.findByUserLesson(userId, lessonId);
  
  // El quiz fue aprobado si ya estaba aprobado antes O se aprobó ahora
  const quizPassed = (existingProgress?.quiz?.passed || false) || passed;
  
  // La lección está completada si el video está completo Y el quiz está aprobado
  const videoCompleted = existingProgress?.video?.completed || false;
  const lessonCompleted = videoCompleted && quizPassed;

  const updateData = {
    quiz: {
      attempts: (existingProgress?.quiz?.attempts || 0) + 1,
      bestScore: Math.max(existingProgress?.quiz?.bestScore || 0, score),
      passed: quizPassed
    },
    completed: lessonCompleted,
    completedAt: lessonCompleted && !existingProgress?.completed ? new Date() : existingProgress?.completedAt
  };

  // Preservar progreso de video existente
  if (existingProgress?.video) {
    updateData.video = existingProgress.video;
  }

  const updatedProgress = await progressRepo.upsertProgress(userId, courseId, lessonId, updateData);

  if (lessonCompleted && !existingProgress?.completed) {
    await courseStatsService.recomputeCourseStats(courseId);
  }

  return {
    quizPassed,
    lessonCompleted,
    score,
    attempts: updateData.quiz.attempts
  };
}

/**
 * Obtiene el progreso detallado de una lección
 */
export async function getLessonProgress({ userId, lessonId }) {
  return await progressRepo.findByUserLesson(userId, lessonId);
}

/**
 * Obtiene el progreso completo de un curso
 */
export async function getCourseProgress({ userId, courseId }) {
  return await progressRepo.listByUserCourse(userId, courseId);
}
