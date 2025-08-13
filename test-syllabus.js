// Script de prueba para demostrar la funcionalidad automática del syllabus
import mongoose from 'mongoose';
import Module from './src/models/Module.js';
import Lesson from './src/models/Lesson.js';
import Course from './src/models/Course.js';
import { updateCourseSyllabus } from './src/services/courseService.js';

// Conectar a MongoDB (usar la misma URL que en tu configuración)
mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function createTestModulesAndLessons() {
  console.log('🚀 Creando curso de prueba...');
  
  // Crear un curso de prueba
  const course = await Course.create({
    owner: new mongoose.Types.ObjectId(), // ID ficticio para el owner
    title: 'Español A1 - Curso de Prueba',
    slug: 'espanol-a1-prueba',
    description: 'Curso de prueba para demostrar la funcionalidad del syllabus automático',
    excerpt: 'Aprende español desde cero con este curso interactivo',
    level: 'A1',
    visibility: 'public',
    status: 'draft',
    pricing: {
      type: 'one_time',
      amountCents: 4999,
      currency: 'EUR'
    },
    tags: ['español', 'principiante', 'a1']
  });
  
  const courseId = course._id;
  console.log(`✅ Curso creado con ID: ${courseId}`);
  
  console.log('🚀 Creando módulos y lecciones de prueba...');
  
  // Crear módulos de prueba
  const module1 = await Module.create({
    course: courseId,
    index: 0,
    title: 'Introducción al Español',
    description: 'Fundamentos básicos del idioma español'
  });
  
  const module2 = await Module.create({
    course: courseId,
    index: 1,
    title: 'Gramática Básica',
    description: 'Estructuras gramaticales fundamentales'
  });
  
  const module3 = await Module.create({
    course: courseId,
    index: 2,
    title: 'Conversación Práctica',
    description: 'Práctica de conversación en situaciones reales'
  });
  
  // Crear lecciones para el módulo 1
  await Lesson.create({
    course: courseId,
    module: module1._id,
    index: 0,
    title: 'Alfabeto y Pronunciación',
    durationSec: 1800 // 30 minutos
  });
  
  await Lesson.create({
    course: courseId,
    module: module1._id,
    index: 1,
    title: 'Saludos y Despedidas',
    durationSec: 1200 // 20 minutos
  });
  
  await Lesson.create({
    course: courseId,
    module: module1._id,
    index: 2,
    title: 'Números del 1 al 100',
    durationSec: 1500 // 25 minutos
  });
  
  // Crear lecciones para el módulo 2
  await Lesson.create({
    course: courseId,
    module: module2._id,
    index: 0,
    title: 'Artículos y Género',
    durationSec: 2100 // 35 minutos
  });
  
  await Lesson.create({
    course: courseId,
    module: module2._id,
    index: 1,
    title: 'Verbos Ser y Estar',
    durationSec: 2400 // 40 minutos
  });
  
  // Crear lecciones para el módulo 3
  await Lesson.create({
    course: courseId,
    module: module3._id,
    index: 0,
    title: 'En el Restaurante',
    durationSec: 1800 // 30 minutos
  });
  
  await Lesson.create({
    course: courseId,
    module: module3._id,
    index: 1,
    title: 'Pidiendo Direcciones',
    durationSec: 1500 // 25 minutos
  });
  
  console.log('✅ Módulos y lecciones creados exitosamente');
  
  // El syllabus debería haberse actualizado automáticamente debido a los hooks
  // Pero vamos a regenerarlo manualmente para estar seguros
  console.log('🔄 Regenerando syllabus...');
  const syllabus = await updateCourseSyllabus(courseId);
  
  console.log('📚 Syllabus generado:', JSON.stringify(syllabus, null, 2));
  
  // Verificar que se guardó en el curso
  const updatedCourse = await Course.findById(courseId);
  console.log('💾 Syllabus en curso:', JSON.stringify(updatedCourse.marketing.syllabus, null, 2));
  
  console.log('🎉 ¡Prueba completada exitosamente!');
  console.log(`📋 Curso de prueba creado con ID: ${courseId}`);
  console.log('📋 Puedes usarlo para probar el endpoint de marketing PATCH');
  process.exit(0);
}

createTestModulesAndLessons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
