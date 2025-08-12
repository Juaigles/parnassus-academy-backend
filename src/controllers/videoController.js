import { videoUpsertSchema } from '../validators/videoSchemas.js';
import * as videoService from '../services/videoAssetService.js';
export async function upsertVideo(req,res,next){ try{ const dto=videoUpsertSchema.parse(req.body); const out=await videoService.upsert({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function getSignedUrl(req,res,next){ try{ const out=await videoService.getSignedUrl({ lessonId:req.params.lessonId, viewer:req.user||null }); res.json(out);}catch(e){next(e);} }
