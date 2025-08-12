import * as progressService from '../services/progressService.js';

export async function recordVideo(req,res,next){
  try{
    const { percent, lastPositionSec, secondsWatched, courseId } = req.body;
    const out = await progressService.recordVideoProgress({
      userId: req.user.id,
      courseId,
      lessonId: req.params.lessonId,
      percent,
      lastPositionSec,
      secondsWatched
    });
    res.json(out);
  }catch(e){ next(e); }
}

export async function markRead(req,res,next){
  try{
    const { courseId } = req.body;
    const out = await progressService.markRead({
      userId: req.user.id,
      courseId,
      lessonId: req.params.lessonId
    });
    res.json(out);
  }catch(e){ next(e); }
}
