import { lessonCreateSchema, lessonUpdateSchema } from '../validators/lessonSchemas.js';
import * as lessonService from '../services/lessonService.js';

export async function createLesson(req,res,next){ try{ const dto=lessonCreateSchema.parse(req.body); const out=await lessonService.createLesson({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function updateLesson(req,res,next){ try{ const dto=lessonUpdateSchema.parse(req.body); const out=await lessonService.updateLesson({ lessonId:req.params.id, patch:dto, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function deleteLesson(req,res,next){ try{ const out=await lessonService.deleteLesson({ lessonId:req.params.id, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function getLesson(req,res,next){ try{ const out=await lessonService.getLessonForViewer({ lessonId:req.params.id, viewer:req.user||null }); res.json(out);}catch(e){next(e);} }
export async function listLessonsByModule(req,res,next){ try{ const out=await lessonService.listByModule(req.params.moduleId); res.json(out);}catch(e){next(e);} }
