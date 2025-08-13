import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar modelos
import Course from './src/models/Course.js';

async function checkCourseOwner() {
  try {
    console.log('🔍 VERIFICANDO OWNER DEL CURSO');
    console.log('=' .repeat(40));
    
    const course = await Course.findById('689c7a6de7d76eb677b817e0');
    if (!course) {
      console.log('❌ Curso no encontrado');
      return;
    }
    
    console.log(`📚 Curso: ${course.title}`);
    console.log(`👤 Owner: ${course.owner}`);
    console.log(`📊 Status: ${course.status}`);
    
    // Usuario correcto para testing
    const correctUser = {
      id: String(course.owner),
      _id: String(course.owner),
      roles: ['teacher']
    };
    
    console.log('\n✅ Usuario correcto para Postman/testing:');
    console.log(JSON.stringify(correctUser, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkCourseOwner();
