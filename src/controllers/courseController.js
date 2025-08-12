import { courseCreateSchema, courseUpdateSchema } from '../validators/courseSchemas.js';
import * as courseService from '../services/courseService.js';

export async function createCourse(req,res,next){ try{ const dto=courseCreateSchema.parse(req.body); const c=await courseService.createCourse({ data:dto, ownerId:req.user.id }); res.status(201).json(c);}catch(e){next(e);} }
export async function updateCourse(req,res,next){ try{ const dto=courseUpdateSchema.parse(req.body); const c=await courseService.updateCourse({ courseId:req.params.id, ownerId:req.user.id, patch:dto }); res.json(c);}catch(e){next(e);} }
export async function submitCourse(req,res,next){ try{ const out=await courseService.submitForApproval({ courseId:req.params.id, ownerId:req.user.id, notes:req.body?.notes }); res.json(out);}catch(e){next(e);} }
export async function listPublic(req,res,next){ try{ const list=await courseService.listPublic({ limit:Number(req.query.limit)||20, skip:Number(req.query.skip)||0 }); res.json(list);}catch(e){next(e);} }
export async function getCourse(req,res,next){ try{ const viewer=req.user||null; const course=await courseService.getCourseForViewer({ courseId:req.params.id, viewer }); res.json(course);}catch(e){next(e);} }
