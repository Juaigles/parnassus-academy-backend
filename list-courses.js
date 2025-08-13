// Script para verificar qué cursos existen en la base de datos
import mongoose from 'mongoose';
import Course from './src/models/Course.js';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function listCourses() {
  try {
    console.log('📋 Listando todos los cursos en la base de datos...');
    
    const courses = await Course.find({}, '_id title slug owner status').lean();
    
    if (courses.length === 0) {
      console.log('❌ No se encontraron cursos en la base de datos');
    } else {
      console.log(`✅ Se encontraron ${courses.length} curso(s):`);
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ID: ${course._id}`);
        console.log(`   Título: ${course.title}`);
        console.log(`   Slug: ${course.slug}`);
        console.log(`   Owner: ${course.owner}`);
        console.log(`   Status: ${course.status}`);
        console.log('   ---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listCourses();
