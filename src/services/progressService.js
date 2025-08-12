import { env } from '../config/env.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';

const VIDEO_THRESHOLD = Number(env.PROGRESS_VIDEO_THRESHOLD || 0.9);

export async function recordVideoProgress({ userId, courseId, lessonId, percent, lastPositionSec, secondsWatched }) {
  const p = await progressRepo.findByUserLesson(userId, lessonId);
  const newPercent = Math.max(p?.video?.percentMax || 0, Math.min(Math.max(percent, 0), 1));

  // ¿tiene quiz la lección?
  const lesson = p ? null : await lessonRepo.findById(lessonId); // minimiza consultas
  const hasQuiz = (lesson?.hasQuiz) || false;

  const complete = (newPercent >= VIDEO_THRESHOLD) && (!hasQuiz ? true : (p?.quiz?.passed || false));
  const patch = {
    video: {
      percentMax: newPercent,
      lastPositionSec: Math.max(lastPositionSec || 0, 0),
      secondsWatched: Math.max((p?.video?.secondsWatched || 0) + Math.max(secondsWatched || 0, 0), 0)
    },
    updatedAt: new Date()
  };
  if (complete && !p?.lessonCompleted) {
    patch.lessonCompleted = true;
    patch.completedAt = new Date();
  }
  return progressRepo.upsertProgress(userId, courseId, lessonId, patch);
}

export async function markRead({ userId, courseId, lessonId }) {
  // Para lecciones sin vídeo
  const patch = {
    lessonCompleted: true,
    completedAt: new Date(),
    updatedAt: new Date()
  };
  return progressRepo.upsertProgress(userId, courseId, lessonId, patch);
}

export async function applyQuizResult({ userId, courseId, lessonId, score, passed }) {
  const p = await progressRepo.findByUserLesson(userId, lessonId);
  const nowPassed = (p?.quiz?.passed || false) || passed;
  const complete = nowPassed && ((p?.video?.percentMax || 0) >= VIDEO_THRESHOLD || !(await lessonRepo.findById(lessonId))?.durationSec);

  const patch = {
    quiz: {
      attempts: (p?.quiz?.attempts || 0) + 1,
      bestScore: Math.max(p?.quiz?.bestScore || 0, score),
      passed: nowPassed
    },
    updatedAt: new Date()
  };
  if (complete && !p?.lessonCompleted) {
    patch.lessonCompleted = true;
    patch.completedAt = new Date();
  }
  return progressRepo.upsertProgress(userId, courseId, lessonId, patch);
}

export const listByUserCourse = (userId, courseId) => progressRepo.listByUserCourse(userId, courseId);
export const findByUserLesson = (userId, lessonId) => progressRepo.findByUserLesson(userId, lessonId);
