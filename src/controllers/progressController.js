import * as progressService from '../services/progressService.js';
import * as videoProgressService from '../services/videoProgressService.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import AppError from '../libs/appError.js';

export async function markLessonComplete(req, res, next) {
  try {
    const lessonId = req.params.lessonId;
    const lesson = await lessonRepo.findById(lessonId);
    
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    
    const progress = await progressService.markLessonComplete({
      userId: req.user.id,
      courseId: lesson.course,
      lessonId
    });
    
    res.json(progress);
  } catch (e) { 
    next(e); 
  }
}

export async function recordVideo(req, res, next) {
  try {
    const { courseId, currentPositionSec, watchedSeconds } = req.body;
    const out = await videoProgressService.recordVideoProgress({
      userId: req.user.id,
      courseId,
      lessonId: req.params.lessonId,
      currentPositionSec,
      watchedSeconds
    });
    res.json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function markRead(req, res, next) {
  try {
    const { courseId } = req.body;
    const out = await videoProgressService.markLessonAsRead({
      userId: req.user.id,
      courseId,
      lessonId: req.params.lessonId
    });
    res.json(out);
  } catch (e) { 
    next(e); 
  }
}

export async function getProgress(req, res, next) {
  try {
    const courseId = req.params.courseId;
    const progress = await videoProgressService.getCourseProgress({
      userId: req.user.id,
      courseId
    });
    res.json(progress);
  } catch (e) { 
    next(e); 
  }
}

export async function getLessonProgress(req, res, next) {
  try {
    const out = await videoProgressService.getLessonProgress({
      userId: req.user.id,
      lessonId: req.params.lessonId
    });
    res.json(out);
  } catch (e) { 
    next(e); 
  }
}
