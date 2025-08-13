import { lessonCreateSchema, lessonUpdateSchema } from '../validators/lessonSchemas.js';
import * as lessonService from '../services/lessonService.js';
import * as purchaseService from '../services/purchaseService.js';
import * as gatingService from '../services/gatingService.js';
import AppError from '../libs/appError.js';

export async function createLesson(req,res,next){ 
  try{ 
    const dto = lessonCreateSchema.parse(req.body); 
    
    // Si viene de ruta anidada, usar los parámetros de URL
    if (req.params.courseId && req.params.moduleId) {
      dto.courseId = req.params.courseId;
      dto.moduleId = req.params.moduleId;
    }
    
    const out = await lessonService.createLesson({ data:dto, user:req.user }); 
    res.status(201).json(out);
  }catch(e){next(e);} 
}
export async function updateLesson(req,res,next){ try{ const dto=lessonUpdateSchema.parse(req.body); const out=await lessonService.updateLesson({ lessonId:req.params.id, patch:dto, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function deleteLesson(req,res,next){ try{ const out=await lessonService.deleteLesson({ lessonId:req.params.id, user:req.user }); res.json(out);}catch(e){next(e);} }
export async function getLesson(req,res,next){ 
  try{ 
    const viewer = req.user || null;
    const lessonId = req.params.id;
    
    // Si hay usuario autenticado, verificar acceso
    if (viewer) {
      // Obtener la lección para saber a qué curso pertenece
      const lesson = await lessonService.getLessonForViewer({ lessonId, viewer: null });
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }
      
      // Verificar acceso al curso
      const accessCheck = await purchaseService.canAccessCourse(viewer, lesson.course);
      
      // Si no tiene acceso pero es la primera lección del primer módulo, permitir vista previa
      if (!accessCheck.hasAccess) {
        if (lesson.moduleIndex === 0 && lesson.index === 0) {
          // Vista previa: devolver lección limitada
          const previewLesson = {
            ...lesson,
            isPreview: true,
            content: lesson.content ? lesson.content.substring(0, 500) + '...' : '',
            videoUrl: null // No mostrar video en vista previa
          };
          return res.json(previewLesson);
        } else {
          throw new AppError('Access denied. Purchase required.', 403);
        }
      }
      
      // Verificar gating de lecciones (si tiene acceso al curso)
      const canAccess = await gatingService.canAccessLesson({ userId: viewer.id, lessonId });
      if (!canAccess.ok) {
        throw new AppError(`Cannot access lesson: ${canAccess.reason}`, 403);
      }
    }
    
    const lesson = await lessonService.getLessonForViewer({ lessonId, viewer });
    res.json(lesson);
  } catch(e) { 
    next(e); 
  } 
}
export async function listLessonsByModule(req,res,next){ try{ const out=await lessonService.listByModule(req.params.moduleId); res.json(out);}catch(e){next(e);} }
