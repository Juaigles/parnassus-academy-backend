import { moduleQuizUpsertSchema, moduleQuizAttemptSchema } from '../validators/moduleQuizSchemas.js';
import * as moduleQuizService from '../services/moduleQuizService.js';

export async function upsertModuleQuiz(req,res,next){ try{ const dto=moduleQuizUpsertSchema.parse({ ...req.body, moduleId: req.params.moduleId }); const out=await moduleQuizService.upsertModuleQuiz({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function getModuleQuiz(req,res,next){ try{ const out=await moduleQuizService.getModuleQuiz({ moduleId:req.params.moduleId, viewer:req.user||null }); res.json(out);}catch(e){next(e);} }
export async function deleteModuleQuiz(req,res,next){ try{ const out=await moduleQuizService.deleteModuleQuiz({ moduleId:req.params.moduleId, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function submitModuleAttempt(req,res,next){ try{ const dto=moduleQuizAttemptSchema.parse(req.body); const out=await moduleQuizService.submitModuleAttempt({ moduleId:req.params.moduleId, userId:req.user.id, payload:dto }); res.status(201).json(out);}catch(e){next(e);} }
export async function listMyModuleAttempts(req,res,next){ try{ const out=await moduleQuizService.listMyModuleAttempts({ userId:req.user.id, moduleId:req.params.moduleId }); res.json(out);}catch(e){next(e);} }
