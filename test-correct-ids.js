import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar servicio
import * as lessonService from './src/services/lessonService.js';

async function testWithCorrectIDs() {
  try {
    console.log('✅ PRUEBA CON IDS CORRECTOS');
    console.log('=' .repeat(60));
    
    // Datos correctos
    const correctData = {
      courseId: "689c7a6de7d76eb677b817e0",
      moduleId: "689c7a6de7d76eb677b817e7",
      title: "Lección Final",
      slug: "leccion-final-" + Date.now(),
      index: Date.now(),
      durationSec: 300,
      content: "<p>Esta es la lección final de prueba</p>",
      resources: [
        {
          title: "Documento Final",
          url: "https://example.com/final.pdf",
          kind: "pdf"
        }
      ]
    };
    
    // Usuario correcto (owner del curso)
    const correctUser = {
      id: "689c7a6de7d76eb677b817df",
      _id: "689c7a6de7d76eb677b817df",
      roles: ['teacher']
    };
    
    console.log('📞 Creando lección con IDs correctos...');
    const result = await lessonService.createLesson({
      data: correctData,
      user: correctUser
    });
    
    console.log('🎉 ¡ÉXITO TOTAL!');
    console.log(`   ID: ${result._id}`);
    console.log(`   Título: ${result.title}`);
    console.log(`   Course: ${result.course}`);
    console.log(`   Module: ${result.module}`);
    console.log(`   Recursos: ${result.resources.length}`);
    
    console.log('\n✅ La creación de lecciones funciona perfectamente con los IDs correctos.');
    console.log('🔧 Usa los IDs proporcionados anteriormente en Postman.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testWithCorrectIDs();
