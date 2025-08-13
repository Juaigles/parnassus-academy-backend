import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function investigateAndFixDatabase() {
  try {
    console.log('🔍 INVESTIGACIÓN COMPLETA DE LA BASE DE DATOS');
    console.log('=' .repeat(60));
    
    const db = mongoose.connection.db;
    const lessonsCollection = db.collection('lessons');
    
    // 1. Listar TODOS los índices existentes
    console.log('\n📋 TODOS LOS ÍNDICES EN LA COLECCIÓN LESSONS:');
    const indexes = await lessonsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // 2. Verificar específicamente el índice problemático
    console.log('\n🔎 BUSCANDO ÍNDICE PROBLEMÁTICO courseId_1_slug_1...');
    const problematicIndex = indexes.find(idx => idx.name === 'courseId_1_slug_1');
    if (problematicIndex) {
      console.log('❌ ENCONTRADO índice problemático:', problematicIndex);
    } else {
      console.log('✅ No se encontró el índice courseId_1_slug_1');
    }
    
    // 3. Contar documentos con valores null
    console.log('\n📊 ANÁLISIS DE DOCUMENTOS:');
    const totalDocs = await lessonsCollection.countDocuments();
    const docsWithNullCourseId = await lessonsCollection.countDocuments({ courseId: null });
    const docsWithNullSlug = await lessonsCollection.countDocuments({ slug: null });
    const docsWithBothNull = await lessonsCollection.countDocuments({ courseId: null, slug: null });
    
    console.log(`📄 Total de documentos: ${totalDocs}`);
    console.log(`🔴 Documentos con courseId null: ${docsWithNullCourseId}`);
    console.log(`🔴 Documentos con slug null: ${docsWithNullSlug}`);
    console.log(`🔴 Documentos con AMBOS null: ${docsWithBothNull}`);
    
    // 4. Mostrar algunos documentos problemáticos
    if (docsWithBothNull > 0) {
      console.log('\n🔍 DOCUMENTOS PROBLEMÁTICOS (primeros 5):');
      const problematicDocs = await lessonsCollection.find({ 
        $or: [
          { courseId: null },
          { slug: null }
        ]
      }).limit(5).toArray();
      
      problematicDocs.forEach((doc, i) => {
        console.log(`${i + 1}. ID: ${doc._id}, courseId: ${doc.courseId}, slug: ${doc.slug}, course: ${doc.course}, module: ${doc.module}`);
      });
    }
    
    // 5. Eliminar el índice problemático si existe
    if (problematicIndex) {
      console.log('\n🗑️ ELIMINANDO ÍNDICE PROBLEMÁTICO...');
      try {
        await lessonsCollection.dropIndex('courseId_1_slug_1');
        console.log('✅ Índice courseId_1_slug_1 eliminado exitosamente');
      } catch (error) {
        console.log('❌ Error eliminando índice:', error.message);
      }
    }
    
    // 6. Eliminar todos los documentos con valores null
    if (docsWithBothNull > 0) {
      console.log('\n🧹 ELIMINANDO DOCUMENTOS CON VALORES NULL...');
      const deleteResult = await lessonsCollection.deleteMany({
        $or: [
          { courseId: null },
          { slug: null },
          { course: null },
          { module: null }
        ]
      });
      console.log(`🗑️ Eliminados ${deleteResult.deletedCount} documentos problemáticos`);
    }
    
    // 7. Verificar el estado final
    console.log('\n📋 ESTADO FINAL DE ÍNDICES:');
    const finalIndexes = await lessonsCollection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    const finalCount = await lessonsCollection.countDocuments();
    const finalNullCount = await lessonsCollection.countDocuments({
      $or: [
        { courseId: null },
        { slug: null },
        { course: null },
        { module: null }
      ]
    });
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`📄 Total documentos restantes: ${finalCount}`);
    console.log(`🔴 Documentos con valores null: ${finalNullCount}`);
    
    if (finalNullCount === 0) {
      console.log('\n🎉 BASE DE DATOS LIMPIA Y LISTA PARA USAR');
    } else {
      console.log('\n⚠️ Aún quedan documentos problemáticos');
    }
    
  } catch (error) {
    console.error('❌ Error durante la investigación:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

investigateAndFixDatabase();
