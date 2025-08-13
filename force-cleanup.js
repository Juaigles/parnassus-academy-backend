import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function forceDropProblematicIndex() {
  try {
    console.log('🛠️ ELIMINACIÓN FORZADA DEL ÍNDICE PROBLEMÁTICO');
    console.log('=' .repeat(60));
    
    const db = mongoose.connection.db;
    const lessonsCollection = db.collection('lessons');
    
    // Listar todos los índices actuales
    console.log('📋 Índices actuales:');
    const indexes = await lessonsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Intentar eliminar específicamente el índice problemático
    const problematicIndexes = ['courseId_1_slug_1', 'courseId_1', 'slug_1'];
    
    for (const indexName of problematicIndexes) {
      try {
        console.log(`\n🗑️ Intentando eliminar índice: ${indexName}`);
        await lessonsCollection.dropIndex(indexName);
        console.log(`✅ Índice ${indexName} eliminado exitosamente`);
      } catch (error) {
        if (error.message.includes('index not found')) {
          console.log(`ℹ️ Índice ${indexName} no existe (bien)`);
        } else {
          console.log(`❌ Error eliminando ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Eliminar TODOS los documentos de la colección lessons para limpiar completamente
    console.log('\n🧹 LIMPIEZA COMPLETA DE DATOS...');
    const deleteResult = await lessonsCollection.deleteMany({});
    console.log(`🗑️ Eliminados ${deleteResult.deletedCount} documentos de lessons`);
    
    // Verificar índices finales
    console.log('\n📋 Índices después de la limpieza:');
    const finalIndexes = await lessonsCollection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 LIMPIEZA COMPLETADA. La colección lessons está lista para usar.');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza forzada:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

forceDropProblematicIndex();
