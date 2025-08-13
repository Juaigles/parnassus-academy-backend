import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar el modelo actual
import Lesson from './src/models/Lesson.js';

async function testLessonCreationAPI() {
  try {
    console.log('🧪 SIMULANDO CREACIÓN DE LECCIÓN VIA API');
    console.log('=' .repeat(60));
    
    // Simular los datos que llegan desde Postman
    const apiData = {
      courseId: "689c6f8efdb814fd5cae090c",
      moduleId: "689c7c8df6680a5db3a6bbec",
      title: "Test Lesson",
      slug: "test-lesson-" + Date.now(),
      index: Date.now(),
      durationSec: 300,
      content: "<p>Test content</p>",
      resources: [
        {
          title: "Test PDF",
          url: "https://example.com/test.pdf",
          kind: "pdf"  // Nota: viene como 'kind', debe transformarse a 'type'
        }
      ]
    };
    
    console.log('📝 Datos de entrada (API):');
    console.log(JSON.stringify(apiData, null, 2));
    
    // Aplicar la misma lógica que en lessonService.js
    console.log('\n🔄 Aplicando transformaciones...');
    
    // Mapear los campos para el modelo de Mongoose
    const lessonData = {
      ...apiData,
      course: apiData.courseId, // El modelo Lesson espera 'course', no 'courseId'
      module: apiData.moduleId  // El modelo Lesson espera 'module', no 'moduleId'
    };
    
    // Eliminar campos de API que no debe tener el modelo
    delete lessonData.courseId;
    delete lessonData.moduleId;
    
    // Mapear contentHtml si viene como content
    if (lessonData.content && !lessonData.contentHtml) {
      lessonData.contentHtml = lessonData.content;
      delete lessonData.content;
    }
    
    // Normalizar recursos: kind → type
    if (lessonData.resources && Array.isArray(lessonData.resources)) {
      lessonData.resources = lessonData.resources.map(resource => ({
        ...resource,
        type: resource.kind || resource.type, // Priorizar kind, fallback a type
      }));
      // Remover el campo kind para evitar conflictos
      lessonData.resources.forEach(resource => delete resource.kind);
    }
    
    console.log('📝 Datos transformados (para Mongoose):');
    console.log(JSON.stringify(lessonData, null, 2));
    
    // Crear usando Mongoose
    console.log('\n💾 Creando documento con Mongoose...');
    const newLesson = new Lesson(lessonData);
    
    console.log('📄 Documento antes de save():');
    console.log('   _id:', newLesson._id);
    console.log('   course:', newLesson.course);
    console.log('   module:', newLesson.module);
    console.log('   courseId:', newLesson.courseId);
    console.log('   moduleId:', newLesson.moduleId);
    console.log('   slug:', newLesson.slug);
    console.log('   title:', newLesson.title);
    console.log('   Documento completo:', JSON.stringify(newLesson.toObject(), null, 2));
    
    // Intentar guardar
    const savedLesson = await newLesson.save();
    console.log('✅ Lección guardada exitosamente!');
    console.log('   ID:', savedLesson._id);
    console.log('   Título:', savedLesson.title);
    
    // Limpiar
    await Lesson.deleteOne({ _id: savedLesson._id });
    console.log('🧹 Lección de prueba eliminada');
    
    console.log('\n🎉 ¡PRUEBA EXITOSA! El problema no está en el modelo.');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('   Tipo:', error.constructor.name);
    if (error.code) console.error('   Código:', error.code);
    if (error.keyPattern) console.error('   Patrón de clave:', error.keyPattern);
    if (error.keyValue) console.error('   Valor de clave:', error.keyValue);
    console.error('   Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testLessonCreationAPI();
