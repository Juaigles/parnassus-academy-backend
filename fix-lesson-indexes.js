// Script para verificar y limpiar índices problemáticos en la colección lessons
import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function checkAndFixIndexes() {
  try {
    console.log('🔍 Verificando índices en la colección lessons...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('lessons');
    
    // Obtener todos los índices
    const indexes = await collection.indexes();
    console.log('📋 Índices actuales:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });
    
    // Buscar el índice problemático
    const problematicIndex = indexes.find(index => 
      index.key.courseId !== undefined && index.key.slug !== undefined
    );
    
    if (problematicIndex) {
      console.log('\n⚠️  Índice problemático encontrado:', problematicIndex.name);
      console.log('🗑️  Eliminando índice problemático...');
      
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Índice problemático eliminado');
    } else {
      console.log('\n✅ No se encontró el índice courseId_1_slug_1');
    }
    
    // Verificar si hay documentos con courseId null
    console.log('\n🔍 Verificando documentos con courseId null...');
    const nullCourseIdDocs = await collection.find({ courseId: null }).toArray();
    console.log(`📊 Documentos con courseId null: ${nullCourseIdDocs.length}`);
    
    if (nullCourseIdDocs.length > 0) {
      console.log('🧹 Eliminando documentos con courseId null...');
      const deleteResult = await collection.deleteMany({ courseId: null });
      console.log(`✅ Eliminados ${deleteResult.deletedCount} documentos problemáticos`);
    }
    
    // Verificar si hay documentos con slug null
    console.log('\n🔍 Verificando documentos con slug null...');
    const nullSlugDocs = await collection.find({ slug: null }).toArray();
    console.log(`📊 Documentos con slug null: ${nullSlugDocs.length}`);
    
    if (nullSlugDocs.length > 0) {
      console.log('🧹 Eliminando documentos con slug null...');
      const deleteResult = await collection.deleteMany({ slug: null });
      console.log(`✅ Eliminados ${deleteResult.deletedCount} documentos problemáticos`);
    }
    
    // Mostrar índices finales
    console.log('\n📋 Índices después de la limpieza:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });
    
    console.log('\n🎉 Limpieza completada. Ahora deberías poder crear lecciones sin problemas.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

checkAndFixIndexes();
