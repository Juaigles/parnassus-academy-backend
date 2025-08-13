// Test del endpoint de regeneración de syllabus usando el curso creado
import mongoose from 'mongoose';
import Course from './src/models/Course.js';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

const courseId = '689c7a6de7d76eb677b817e0'; // ID del curso creado

async function testSyllabusInMarketing() {
  try {
    console.log('🔍 Verificando el syllabus en marketing...');
    
    const course = await Course.findById(courseId).lean();
    
    if (!course) {
      console.log('❌ Curso no encontrado');
      return;
    }
    
    console.log('✅ Curso encontrado:', course.title);
    console.log('📚 Syllabus en marketing:');
    console.log(JSON.stringify(course.marketing?.syllabus || 'No hay syllabus', null, 2));
    
    // Verificar que el marketing tiene la estructura correcta
    if (course.marketing?.syllabus?.length > 0) {
      console.log(`✅ El syllabus tiene ${course.marketing.syllabus.length} módulos`);
      
      course.marketing.syllabus.forEach((module, i) => {
        console.log(`  📖 Módulo ${i + 1}: ${module.title} (${module.lessons?.length || 0} lecciones)`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSyllabusInMarketing();
