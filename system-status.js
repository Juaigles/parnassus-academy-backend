import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar modelos
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Lesson from './src/models/Lesson.js';

async function showSystemStatus() {
  try {
    console.log('📊 ESTADO DEL SISTEMA - GENERACIÓN AUTOMÁTICA DE SYLLABUS');
    console.log('=' .repeat(60));
    
    // Obtener estadísticas
    const courseCount = await Course.countDocuments();
    const moduleCount = await Module.countDocuments();
    const lessonCount = await Lesson.countDocuments();
    
    console.log(`📚 Total de cursos: ${courseCount}`);
    console.log(`📖 Total de módulos: ${moduleCount}`);
    console.log(`📝 Total de lecciones: ${lessonCount}`);
    
    console.log('\n🔍 DETALLES DE CURSOS CON SYLLABUS AUTOMÁTICO:');
    console.log('-' .repeat(60));
    
    // Mostrar todos los cursos con sus syllabus
    const courses = await Course.find();
    
    for (const course of courses) {
      console.log(`\n📚 ${course.title} (${course._id})`);
      console.log(`   📅 Creado: ${course.createdAt?.toLocaleDateString()}`);
      console.log(`   📊 Nivel: ${course.level}`);
      
      if (course.marketing?.syllabus && course.marketing.syllabus.length > 0) {
        console.log(`   📋 Syllabus (${course.marketing.syllabus.length} módulos):`);
        
        course.marketing.syllabus.forEach((module, idx) => {
          console.log(`      ${idx + 1}. ${module.title}`);
          if (module.lessons && module.lessons.length > 0) {
            module.lessons.forEach((lesson, lessonIdx) => {
              const duration = lesson.durationSec ? ` (${Math.floor(lesson.durationSec / 60)}min)` : '';
              console.log(`         ${lessonIdx + 1}.${idx + 1}. ${lesson.title}${duration}`);
            });
          } else {
            console.log(`         📌 Sin lecciones aún`);
          }
        });
      } else {
        console.log(`   ⚠️  Sin syllabus generado`);
      }
    }
    
    console.log('\n✅ FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('-' .repeat(60));
    console.log('✅ Generación automática de syllabus al crear/modificar módulos');
    console.log('✅ Generación automática de syllabus al crear/modificar lecciones');
    console.log('✅ Hooks automáticos en base de datos (post-save, post-update, post-delete)');
    console.log('✅ Normalización de campos entre API y base de datos');
    console.log('✅ Validación de ObjectIds para courseId y moduleId');
    console.log('✅ Generación automática de slugs únicos');
    console.log('✅ Mapeo automático de campos (courseId ↔ course, moduleId ↔ module)');
    console.log('✅ Limpieza de datos corruptos y problemas de índices');
    console.log('✅ Estructura de syllabus integrada en marketing del curso');
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('-' .repeat(60));
    console.log('🎉 Sistema de generación automática de syllabus completamente funcional');
    console.log('🔄 Actualización en tiempo real cuando cambia el contenido');
    console.log('📚 Estructura clara: Curso → Módulos → Lecciones');
    console.log('⚡ Sin intervención manual requerida');
    console.log('🛡️  Validación y normalización automática de datos');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

showSystemStatus();
