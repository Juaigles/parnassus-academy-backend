import { moduleCreateSchema, moduleUpdateSchema } from '../validators/moduleSchemas.js';
import * as moduleService from '../services/moduleService.js';

export async function createModule(req,res,next){ try{ const dto=moduleCreateSchema.parse(req.body); const out=await moduleService.createModule({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function updateModule(req,res,next){ try{ const dto=moduleUpdateSchema.parse(req.body); const out=await moduleService.updateModule({ moduleId:req.params.id, patch:dto, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function deleteModule(req,res,next){ try{ const out=await moduleService.deleteModule({ moduleId:req.params.id, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function listModulesByCourse(req,res,next){ try{ const out=await moduleService.listByCourse(req.params.courseId); res.json(out);}catch(e){next(e);} }
