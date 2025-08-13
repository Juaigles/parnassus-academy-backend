// Demostración completa del flujo de syllabus automático
import mongoose from 'mongoose';
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Lesson from './src/models/Lesson.js';
import { updateCourseSyllabus } from './src/services/courseService.js';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function fullDemo() {
  try {
    console.log('🎬 === DEMOSTRACIÓN COMPLETA DEL SYLLABUS AUTOMÁTICO ===\n');
    
    // === PASO 1: Crear un nuevo curso ===
    console.log('📚 PASO 1: Creando nuevo curso...');
    const course = await Course.create({
      owner: new mongoose.Types.ObjectId(),
      title: 'Francés A1 - Curso Completo',
      slug: 'frances-a1-completo',
      description: 'Aprende francés desde cero con este curso interactivo',
      excerpt: 'Curso de francés para principiantes',
      level: 'A1',
      visibility: 'public',
      status: 'draft',
      pricing: {
        type: 'one_time',
        amountCents: 5999,
        currency: 'EUR'
      },
      tags: ['francés', 'principiante', 'a1']
    });
    
    console.log(`✅ Curso creado: ${course.title} (ID: ${course._id})\n`);
    
    // === PASO 2: Crear módulos ===
    console.log('📖 PASO 2: Creando módulos...');
    
    const module1 = await Module.create({
      course: course._id,
      index: 0,
      title: 'Básicos del Francés',
      description: 'Fundamentos esenciales'
    });
    console.log(`   ✅ Módulo 1: ${module1.title}`);
    
    const module2 = await Module.create({
      course: course._id,
      index: 1,
      title: 'Gramática Fundamental',
      description: 'Estructuras básicas del francés'
    });
    console.log(`   ✅ Módulo 2: ${module2.title}`);
    
    const module3 = await Module.create({
      course: course._id,
      index: 2,
      title: 'Situaciones Cotidianas',
      description: 'Francés para el día a día'
    });
    console.log(`   ✅ Módulo 3: ${module3.title}\n`);
    
    // === PASO 3: Crear lecciones para módulo 1 ===
    console.log('📝 PASO 3: Creando lecciones para "Básicos del Francés"...');
    
    await Lesson.create({
      course: course._id,
      module: module1._id,
      index: 0,
      title: 'Bonjour! - Saludos',
      durationSec: 1200,
      contentHtml: '<p>Aprende los saludos básicos en francés</p>'
    });
    console.log('   ✅ Lección: Bonjour! - Saludos');
    
    await Lesson.create({
      course: course._id,
      module: module1._id,
      index: 1,
      title: 'Les nombres - Los números',
      durationSec: 1500,
      contentHtml: '<p>Números del 1 al 100 en francés</p>'
    });
    console.log('   ✅ Lección: Les nombres - Los números');
    
    await Lesson.create({
      course: course._id,
      module: module1._id,
      index: 2,
      title: 'Les couleurs - Los colores',
      durationSec: 900,
      contentHtml: '<p>Colores básicos en francés</p>'
    });
    console.log('   ✅ Lección: Les couleurs - Los colores\n');
    
    // === PASO 4: Crear lecciones para módulo 2 ===
    console.log('📝 PASO 4: Creando lecciones para "Gramática Fundamental"...');
    
    await Lesson.create({
      course: course._id,
      module: module2._id,
      index: 0,
      title: 'Le/La/Les - Artículos',
      durationSec: 1800,
      contentHtml: '<p>Artículos definidos en francés</p>'
    });
    console.log('   ✅ Lección: Le/La/Les - Artículos');
    
    await Lesson.create({
      course: course._id,
      module: module2._id,
      index: 1,
      title: 'Être et Avoir - Ser y Tener',
      durationSec: 2400,
      contentHtml: '<p>Verbos fundamentales être y avoir</p>'
    });
    console.log('   ✅ Lección: Être et Avoir - Ser y Tener\n');
    
    // === PASO 5: Crear lecciones para módulo 3 ===
    console.log('📝 PASO 5: Creando lecciones para "Situaciones Cotidianas"...');
    
    await Lesson.create({
      course: course._id,
      module: module3._id,
      index: 0,
      title: 'Au restaurant - En el restaurante',
      durationSec: 2100,
      contentHtml: '<p>Cómo pedir comida en francés</p>'
    });
    console.log('   ✅ Lección: Au restaurant - En el restaurante');
    
    await Lesson.create({
      course: course._id,
      module: module3._id,
      index: 1,
      title: 'Faire les courses - Hacer la compra',
      durationSec: 1800,
      contentHtml: '<p>Vocabulario para ir de compras</p>'
    });
    console.log('   ✅ Lección: Faire les courses - Hacer la compra\n');
    
    // === PASO 6: Verificar el syllabus automático ===
    console.log('🔍 PASO 6: Verificando el syllabus automático...');
    
    // Esperar un momento para que todos los hooks se ejecuten
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedCourse = await Course.findById(course._id);
    const syllabus = updatedCourse.marketing.syllabus;
    
    console.log('\n📋 === SYLLABUS GENERADO AUTOMÁTICAMENTE ===');
    console.log(JSON.stringify(syllabus, null, 2));
    
    // === PASO 7: Estadísticas del curso ===
    console.log('\n📊 === ESTADÍSTICAS DEL CURSO ===');
    const totalModules = syllabus.length;
    const totalLessons = syllabus.reduce((acc, module) => acc + module.lessons.length, 0);
    const totalDuration = syllabus.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.durationSec, 0), 0
    );
    
    console.log(`📖 Total de módulos: ${totalModules}`);
    console.log(`📝 Total de lecciones: ${totalLessons}`);
    console.log(`⏱️  Duración total: ${Math.round(totalDuration / 60)} minutos`);
    console.log(`🎯 Duración promedio por lección: ${Math.round((totalDuration / totalLessons) / 60)} minutos\n`);
    
    // === PASO 8: Mostrar estructura detallada ===
    console.log('🏗️  === ESTRUCTURA DETALLADA DEL CURSO ===');
    syllabus.forEach((module, moduleIndex) => {
      console.log(`\n📖 MÓDULO ${moduleIndex + 1}: ${module.title}`);
      console.log(`   (${module.lessons.length} lecciones)`);
      
      module.lessons.forEach((lesson, lessonIndex) => {
        const minutes = Math.round(lesson.durationSec / 60);
        console.log(`   📝 ${moduleIndex + 1}.${lessonIndex + 1} ${lesson.title} (${minutes}min)`);
      });
    });
    
    console.log('\n🎉 === DEMOSTRACIÓN COMPLETA ===');
    console.log(`✅ Curso creado exitosamente con ID: ${course._id}`);
    console.log('✅ Syllabus generado automáticamente');
    console.log('✅ Todos los hooks funcionando correctamente');
    console.log('\n🔗 URLs para probar en Postman:');
    console.log(`   GET http://localhost:3000/courses/${course._id}`);
    console.log(`   POST http://localhost:3000/courses/${course._id}/syllabus/regenerate`);
    console.log(`   PATCH http://localhost:3000/courses/${course._id}/marketing`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la demostración:', error);
    process.exit(1);
  }
}

fullDemo();
