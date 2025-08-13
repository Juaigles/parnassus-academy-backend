// Test para verificar que los hooks automáticos funcionan al agregar lecciones
import mongoose from 'mongoose';
import Lesson from './src/models/Lesson.js';
import Module from './src/models/Module.js';
import Course from './src/models/Course.js';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

const courseId = '689c7a6de7d76eb677b817e0'; // ID del curso creado

async function testAutomaticSyllabusUpdate() {
  try {
    console.log('🧪 Probando actualización automática del syllabus...');
    
    // Obtener el primer módulo
    const firstModule = await Module.findOne({ course: courseId, index: 0 });
    if (!firstModule) {
      console.log('❌ No se encontró el primer módulo');
      return;
    }
    
    console.log(`📖 Agregando nueva lección al módulo: ${firstModule.title}`);
    
    // Agregar una nueva lección
    const newLesson = await Lesson.create({
      course: courseId,
      module: firstModule._id,
      index: 3, // siguiente índice
      title: 'Días de la Semana y Meses',
      durationSec: 900 // 15 minutos
    });
    
    console.log(`✅ Nueva lección creada: ${newLesson.title}`);
    
    // Esperar un momento para que el hook se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar que el syllabus se actualizó automáticamente
    const updatedCourse = await Course.findById(courseId);
    const syllabus = updatedCourse.marketing.syllabus;
    
    console.log('🔍 Syllabus actualizado:');
    syllabus.forEach((module, i) => {
      console.log(`  📖 Módulo ${i + 1}: ${module.title}`);
      module.lessons.forEach((lesson, j) => {
        console.log(`    📝 Lección ${j + 1}: ${lesson.title} (${lesson.durationSec}s)`);
      });
    });
    
    // Verificar que la nueva lección está en el primer módulo
    const firstModuleInSyllabus = syllabus[0];
    const hasNewLesson = firstModuleInSyllabus.lessons.some(lesson => 
      lesson.title === 'Días de la Semana y Meses'
    );
    
    if (hasNewLesson) {
      console.log('✅ ¡Hook automático funcionando! La nueva lección apareció en el syllabus');
    } else {
      console.log('❌ Hook automático no funcionó - la lección no apareció');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAutomaticSyllabusUpdate();
