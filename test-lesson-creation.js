import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar modelos
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Lesson from './src/models/Lesson.js';

async function testLessonCreation() {
  try {
    console.log('🔍 Buscando un curso existente...');
    
    // Buscar un curso existente
    const course = await Course.findOne();
    if (!course) {
      console.log('❌ No hay cursos disponibles');
      return;
    }
    
    console.log(`✅ Curso encontrado: ${course.title} (${course._id})`);
    
    // Buscar un módulo de ese curso
    const module = await Module.findOne({ course: course._id });
    if (!module) {
      console.log('❌ No hay módulos disponibles para este curso');
      return;
    }
    
    console.log(`✅ Módulo encontrado: ${module.title} (${module._id})`);
    
    // Crear una lección de prueba
    console.log('📝 Creando lección de prueba...');
    
    const lesson = new Lesson({
      course: course._id,
      module: module._id,
      title: 'Lección de Prueba',
      slug: 'leccion-prueba-' + Date.now(),
      index: 1,
      durationSec: 300,
      content: '<p>Contenido de prueba para verificar que las lecciones se crean correctamente.</p>',
      resources: [{
        title: 'Recurso de prueba',
        url: 'https://example.com/recurso.pdf',
        type: 'pdf'
      }]
    });
    
    const savedLesson = await lesson.save();
    console.log(`✅ Lección creada exitosamente: ${savedLesson.title} (${savedLesson._id})`);
    
    // Verificar que el syllabus se actualizó automáticamente
    const updatedCourse = await Course.findById(course._id);
    console.log('📚 Syllabus actualizado:');
    console.log(JSON.stringify(updatedCourse.marketing.syllabus, null, 2));
    
    console.log('🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

testLessonCreation();
