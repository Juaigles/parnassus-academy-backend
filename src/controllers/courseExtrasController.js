import { finalQuizUpsertSchema, finalQuizAttemptSchema } from '../validators/courseExtrasSchemas.js';
import * as finalQuizService from '../services/finalQuizService.js';
import * as certificateService from '../services/certificateService.js';

export async function upsertFinalQuiz(req,res,next){ try{ const dto=finalQuizUpsertSchema.parse({ ...req.body, courseId: req.params.courseId }); const out=await finalQuizService.upsertFinalQuiz({ data:dto, user:req.user }); res.status(201).json(out);}catch(e){next(e);} }
export async function getFinalQuiz(req,res,next){ try{ const out=await finalQuizService.getFinalQuiz({ courseId:req.params.courseId, viewer:req.user||null }); res.json(out);}catch(e){next(e);} }
export async function submitFinalAttempt(req,res,next){ try{ const dto=finalQuizAttemptSchema.parse(req.body); const out=await finalQuizService.submitFinalAttempt({ courseId:req.params.courseId, userId:req.user.id, payload:dto }); res.status(201).json(out);}catch(e){next(e);} }

export async function verifyCertificate(req,res,next){ try{ const cert=await certificateService.verifyBySerial(req.params.serial); if(!cert) return res.status(404).json({ error:'Not found' }); res.json(cert);}catch(e){next(e);} }
export async function listMyCertificates(req,res,next){ try{ const list=await certificateService.listMyCertificates(req.user.id); res.json(list);}catch(e){next(e);} }
export async function downloadCertificate(req,res,next){ try{ const cert=await certificateService.verifyBySerial(req.params.serial); if(!cert) return res.status(404).json({ error:'Not found' }); if(String(cert.userId)!==String(req.user.id) && !(req.user.roles||[]).includes('admin')) return res.status(403).json({ error:'Forbidden' }); const url=certificateService.getSignedPdfUrl(cert); res.json({ url }); }catch(e){next(e);} }
