import { courseCreateSchema, courseUpdateSchema } from '../validators/courseSchemas.js';
import { marketingPatchSchema } from '../validators/courseMarketingSchemas.js';
import * as courseService from '../services/courseService.js';
import * as courseViewService from '../services/courseViewService.js';
import * as courseRepo from '../repositories/courseRepo.js';
import * as purchaseService from '../services/purchaseService.js';
import AppError from '../libs/appError.js';

export async function createCourse(req,res,next){
  try{
    const dto = courseCreateSchema.parse(req.body);
    const c = await courseRepo.create({ ...dto, owner: req.user.id, status: 'draft' });
    res.status(201).json(c);
  }catch(e){ next(e); }
}

export async function updateCourse(req,res,next){
  try{
    const dto = courseUpdateSchema.parse(req.body);
    const c = await courseService.updateCourse({ courseId:req.params.id, ownerId:req.user.id, patch:dto });
    res.json(c);
  }catch(e){ next(e); }
}

export async function submitCourse(req,res,next){
  try{
    const out = await courseService.submitForApproval({ courseId:req.params.id, ownerId:req.user.id, notes:req.body?.notes });
    res.json(out);
  }catch(e){ next(e); }
}

/** LISTADO PARA TARJETAS (público) */
export async function listPublic(req,res,next){
  try{
    const list = await courseViewService.listCards({
      limit:Number(req.query.limit)||20,
      skip:Number(req.query.skip)||0,
      level:req.query.level,
      tag:req.query.tag,
      search:req.query.search
    });
    res.json(list);
  }catch(e){ next(e); }
}

/** DETALLE PÚBLICO POR SLUG (para la página del curso) */
export async function getCourseBySlug(req,res,next){
  try{
    const detail = await courseViewService.getDetailBySlug(req.params.slug);
    if (!detail) throw new AppError('Course not found', 404);
    res.json(detail);
  }catch(e){ next(e); }
}

/** (privado) GET por id que ya tenías, lo dejo por compatibilidad */
export async function getCourse(req,res,next){
  try{
    const viewer = req.user||null;
    
    // Si hay usuario, verificar acceso
    if (viewer) {
      const accessCheck = await purchaseService.canAccessCourse(viewer, req.params.id);
      if (!accessCheck.hasAccess) {
        throw new AppError('Access denied. Purchase required.', 403);
      }
    }
    
    const course = await courseService.getCourseForViewer({ courseId:req.params.id, viewer });
    res.json(course);
  }catch(e){ next(e); }
}

/** PATCH marketing */
export async function patchMarketing(req,res,next){
  try{
    // Validar con el esquema correcto
    const dto = marketingPatchSchema.parse(req.body);
    
    // Llamar al servicio
    const c = await courseService.updateMarketing({
      courseId: req.params.id,
      ownerId: req.user.id,
      marketingPatch: dto
    });
    
    res.json(c);
  }catch(e){ 
    console.log('❌ Error en patchMarketing:', e.message);
    next(e); 
  }
}

/** POST regenerar syllabus automáticamente */
export async function regenerateSyllabus(req,res,next){
  try{
    const syllabus = await courseService.updateCourseSyllabus(req.params.id);
    res.json({ 
      success: true, 
      message: 'Syllabus regenerado automáticamente',
      syllabus 
    });
  }catch(e){ 
    console.log('❌ Error en regenerateSyllabus:', e.message);
    next(e); 
  }
}
