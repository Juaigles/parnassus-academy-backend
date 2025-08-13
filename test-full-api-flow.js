import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

// Importar todos los servicios y repositorios
import * as lessonService from './src/services/lessonService.js';
import * as courseRepo from './src/repositories/courseRepo.js';
import * as moduleRepo from './src/repositories/moduleRepo.js';

async function testFullAPIFlow() {
  try {
    console.log('🔍 PROBANDO FLUJO COMPLETO DE API');
    console.log('=' .repeat(60));
    
    // 1. Datos exactos del error
    const requestData = {
      courseId: "689c6f8efdb814fd5cae090c",
      moduleId: "689c7c8df6680a5db3a6bbec",
      title: "Fundamentos 1",
      slug: "fundamentos-" + Date.now(),
      index: Date.now(),
      durationSec: 300,
      content: "<p>¡Hola! Esta lección cubre saludos.</p>",
      resources: [
        {
          title: "Apuntes PDF",
          url: "https://example.com/a1-saludos.pdf",
          kind: "pdf"
        }
      ]
    };
    
    console.log('📋 Datos de request:');
    console.log(JSON.stringify(requestData, null, 2));
    
    // 2. Verificar que el curso existe
    console.log('\n🔍 Verificando curso...');
    const course = await courseRepo.findById(requestData.courseId);
    if (!course) {
      console.log('❌ Curso no encontrado');
      return;
    }
    console.log(`✅ Curso encontrado: ${course.title}`);
    
    // 3. Verificar que el módulo existe
    console.log('\n🔍 Verificando módulo...');
    const module = await moduleRepo.findById(requestData.moduleId);
    if (!module) {
      console.log('❌ Módulo no encontrado');
      return;
    }
    console.log(`✅ Módulo encontrado: ${module.title}`);
    
    // 4. Usuario mock
    const mockUser = {
      _id: '689b177ef25bfe1516d17b0c',
      roles: ['teacher']
    };
    
    // 5. Llamar al servicio exactamente como lo hace el controlador
    console.log('\n📞 Llamando lessonService.createLesson...');
    const result = await lessonService.createLesson({
      data: requestData,
      user: mockUser
    });
    
    console.log('✅ Lección creada exitosamente:');
    console.log(`   ID: ${result._id}`);
    console.log(`   Título: ${result.title}`);
    console.log(`   Course: ${result.course}`);
    console.log(`   Module: ${result.module}`);
    
    // Limpiar
    await mongoose.model('Lesson').deleteOne({ _id: result._id });
    console.log('🧹 Lección eliminada');
    
  } catch (error) {
    console.error('❌ Error en el flujo de API:');
    console.error('   Mensaje:', error.message);
    console.error('   Tipo:', error.constructor.name);
    if (error.code) console.error('   Código:', error.code);
    if (error.keyPattern) console.error('   Patrón de clave:', error.keyPattern);
    if (error.keyValue) console.error('   Valor de clave:', error.keyValue);
    console.error('   Stack completo:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testFullAPIFlow();
