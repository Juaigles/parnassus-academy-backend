import { videoAssetCreateSchema } from '../validators/videoAssetSchemas.js';
import * as videoAssetService from '../services/videoAssetService.js';

export async function upsertVideo(req,res,next){
  try{
    const dto = videoAssetCreateSchema.parse(req.body);
    const out = await videoAssetService.upsertVideoAsset({ data: dto, user: req.user });
    res.status(201).json(out);
  }catch(e){ next(e); }
}

export async function getLessonVideoUrl(req,res,next){
  try{
    const out = await videoAssetService.getLessonVideoUrl({ lessonId: req.params.lessonId, viewer: req.user || null });
    res.json(out);
  }catch(e){ next(e); }
}

export async function deleteLessonVideo(req,res,next){
  try{
    const out = await videoAssetService.deleteLessonVideo({ lessonId: req.params.lessonId, user: req.user });
    res.json(out);
  }catch(e){ next(e); }
}
