import * as courseRepo from '../repositories/courseRepo.js';
import * as approvalRepo from '../repositories/approvalRepo.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import AppError from '../libs/appError.js';
import { assertCanEditCourse } from './gatingService.js';

export async function createCourse({ data, ownerId }) {
  return courseRepo.create({ ...data, owner: ownerId, status: 'draft' });
}
export async function updateCourse({ courseId, ownerId, patch }) {
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (String(course.owner)!==String(ownerId)) throw new AppError('Forbidden', 403);
  if (['approved','published'].includes(course.status)) throw new AppError('Conflict', 409);
  Object.assign(course, patch);
  return course.save();
}
export const listPublic = ({ limit, skip })=> courseRepo.listPublic({ limit, skip });

export async function submitForApproval({ courseId, ownerId, notes }){
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (String(course.owner)!==String(ownerId)) throw new AppError('Forbidden', 403);
  if (course.status!=='draft') throw new AppError('Conflict', 409, 'Solo cursos en borrador pueden enviarse');
  course.status = 'submitted'; await course.save();
  await approvalRepo.createPending({ courseId: course._id, submittedBy: ownerId, notes });
  return { status: course.status };
}
export async function getCourseForViewer({ courseId, viewer }){
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  const isOwner = viewer && String(course.owner)===String(viewer.id);
  const isAdmin = viewer?.roles?.includes('admin');
  if (course.status!=='published' && !isOwner && !isAdmin) throw new AppError('Forbidden', 403);
  return course;
}

export async function updateMarketing({ courseId, ownerId, marketingPatch }) {
  console.log('🔍 updateMarketing called with:', { courseId, ownerId, marketingPatch });
  
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (String(course.owner) !== String(ownerId)) throw new AppError('Forbidden', 403);

  assertCanEditCourse(course, { id: ownerId, roles: ['teacher'] });

  // Deep merge marketing con preservación de estructura
  const currentMarketing = course.marketing ? course.marketing.toObject() : {};
  console.log('📄 Current marketing:', currentMarketing);
  
  const newMarketing = deepMergeMarketing(currentMarketing, marketingPatch);
  console.log('🔄 New marketing after merge:', newMarketing);
  
  // Forzar que Mongoose detecte el cambio usando markModified
  course.marketing = newMarketing;
  course.markModified('marketing');
  
  await course.save();
  
  console.log('✅ Course saved successfully');
  console.log('💾 Final marketing in course:', course.marketing);
  return course;
}

function deepMergeMarketing(current, patch) {
  const result = { ...current };
  
  // Normalizar nombres de campos antes del merge
  const normalizedPatch = { ...patch };
  
  // Normalizar objectives -> mantener como objectives (no cambiar a goals)
  if (normalizedPatch.goals && !normalizedPatch.objectives) {
    normalizedPatch.objectives = normalizedPatch.goals;
    delete normalizedPatch.goals;
  }
  
  // Normalizar instructor -> remover (solo guardar ID si tuviéramos uno)
  if (normalizedPatch.instructor) {
    // Por ahora, remover instructor ya que necesitaríamos crear/buscar un Teacher
    delete normalizedPatch.instructor;
  }
  if (normalizedPatch.teacher && typeof normalizedPatch.teacher === 'object') {
    // Por ahora, remover teacher object ya que necesitaríamos crear/buscar un Teacher
    delete normalizedPatch.teacher;
  }
  
  // Normalizar faqs -> mantener como faqs
  if (normalizedPatch.faq && !normalizedPatch.faqs) {
    normalizedPatch.faqs = normalizedPatch.faq;
    delete normalizedPatch.faq;
  }
  
  // Normalizar methodology (array simple) -> methodology (array de objetos)
  if (normalizedPatch.methodology && Array.isArray(normalizedPatch.methodology)) {
    normalizedPatch.methodology = normalizedPatch.methodology.map(item => {
      if (typeof item === 'string') {
        return {
          title: item,
          description: `Metodología: ${item}`
        };
      }
      return item;
    });
  }
  
  // Normalizar resources: type -> kind
  if (normalizedPatch.resources && Array.isArray(normalizedPatch.resources)) {
    normalizedPatch.resources = normalizedPatch.resources.map(resource => ({
      ...resource,
      kind: resource.type || resource.kind,
      type: undefined // remover el field type
    }));
  }
  
  // Normalizar testimonials: studentName -> authorName
  if (normalizedPatch.testimonials && Array.isArray(normalizedPatch.testimonials)) {
    normalizedPatch.testimonials = normalizedPatch.testimonials.map(testimonial => ({
      ...testimonial,
      authorName: testimonial.studentName || testimonial.authorName,
      countryCode: testimonial.country || testimonial.countryCode || 'ES',
      studentName: undefined, // remover el field studentName
      country: undefined // remover el field country
    }));
  }
  
  for (const [key, value] of Object.entries(normalizedPatch)) {
    if (value === null || value === undefined) {
      continue; // No sobrescribir con valores nulos
    }
    
    if (Array.isArray(value)) {
      result[key] = [...value]; // Reemplazar arrays completamente
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { ...(result[key] || {}), ...value }; // Merge objetos
    } else {
      result[key] = value; // Primitivos
    }
  }
  
  return result;
}

/**
 * Genera automáticamente el syllabus (índice) del curso basado en módulos y lecciones
 */
export async function generateCourseSyllabus(courseId) {
  console.log('📚 Generating syllabus for course:', courseId);
  
  // Obtener todos los módulos del curso ordenados por index
  const modules = await Module.find({ course: courseId }).sort({ index: 1 }).lean();
  
  if (!modules.length) {
    console.log('ℹ️ No modules found for course:', courseId);
    return [];
  }
  
  const syllabus = [];
  
  for (const module of modules) {
    // Obtener todas las lecciones del módulo ordenadas por index
    const lessons = await Lesson.find({ 
      course: courseId, 
      module: module._id 
    }).sort({ index: 1 }).lean();
    
    const syllabusModule = {
      title: module.title,
      lessons: lessons.map(lesson => ({
        title: lesson.title,
        durationSec: lesson.durationSec || 0
      }))
    };
    
    syllabus.push(syllabusModule);
  }
  
  console.log('✅ Generated syllabus:', syllabus.length, 'modules');
  return syllabus;
}

/**
 * Actualiza automáticamente el syllabus en el marketing del curso
 */
export async function updateCourseSyllabus(courseId) {
  console.log('🔄 Updating course syllabus for course:', courseId);
  
  const course = await courseRepo.findById(courseId);
  if (!course) {
    console.log('❌ Course not found:', courseId);
    return;
  }
  
  // Generar el nuevo syllabus
  const syllabus = await generateCourseSyllabus(courseId);
  
  // Actualizar el marketing con el nuevo syllabus
  if (!course.marketing) {
    course.marketing = {};
  }
  
  course.marketing.syllabus = syllabus;
  course.markModified('marketing.syllabus');
  
  await course.save();
  console.log('✅ Course syllabus updated successfully');
  
  return syllabus;
}