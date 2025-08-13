import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar modelos
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Lesson from './src/models/Lesson.js';

async function listCurrentData() {
  try {
    console.log('📋 DATOS ACTUALES EN LA BASE DE DATOS');
    console.log('=' .repeat(60));
    
    // Listar cursos
    console.log('\n📚 CURSOS DISPONIBLES:');
    const courses = await Course.find().lean();
    if (courses.length === 0) {
      console.log('❌ No hay cursos en la base de datos');
    } else {
      courses.forEach((course, i) => {
        console.log(`${i + 1}. ${course.title}`);
        console.log(`   ID: ${course._id}`);
        console.log(`   Slug: ${course.slug}`);
        console.log(`   Nivel: ${course.level}`);
      });
    }
    
    // Listar módulos
    console.log('\n📖 MÓDULOS DISPONIBLES:');
    const modules = await Module.find().lean();
    if (modules.length === 0) {
      console.log('❌ No hay módulos en la base de datos');
    } else {
      modules.forEach((module, i) => {
        console.log(`${i + 1}. ${module.title}`);
        console.log(`   ID: ${module._id}`);
        console.log(`   Curso: ${module.course}`);
        console.log(`   Índice: ${module.index}`);
      });
    }
    
    // Listar lecciones
    console.log('\n📝 LECCIONES DISPONIBLES:');
    const lessons = await Lesson.find().lean();
    if (lessons.length === 0) {
      console.log('❌ No hay lecciones en la base de datos');
    } else {
      lessons.forEach((lesson, i) => {
        console.log(`${i + 1}. ${lesson.title}`);
        console.log(`   ID: ${lesson._id}`);
        console.log(`   Curso: ${lesson.course}`);
        console.log(`   Módulo: ${lesson.module}`);
        console.log(`   Slug: ${lesson.slug}`);
      });
    }
    
    // Proporcionar IDs correctos para Postman
    if (courses.length > 0 && modules.length > 0) {
      console.log('\n🎯 DATOS PARA USAR EN POSTMAN:');
      console.log('-' .repeat(40));
      const firstCourse = courses[0];
      const courseModules = modules.filter(m => String(m.course) === String(firstCourse._id));
      
      if (courseModules.length > 0) {
        console.log(`✅ Curso ID válido: ${firstCourse._id}`);
        console.log(`✅ Módulo ID válido: ${courseModules[0]._id}`);
        console.log('\nJSON para Postman:');
        console.log(JSON.stringify({
          courseId: String(firstCourse._id),
          moduleId: String(courseModules[0]._id),
          title: "Nueva Lección",
          slug: "nueva-leccion-" + Date.now(),
          index: Date.now(),
          durationSec: 300,
          content: "<p>Contenido de la lección</p>",
          resources: [
            {
              title: "Recurso de prueba",
              url: "https://example.com/recurso.pdf",
              kind: "pdf"
            }
          ]
        }, null, 2));
      } else {
        console.log('❌ No hay módulos para el primer curso');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listCurrentData();
