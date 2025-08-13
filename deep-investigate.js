import mongoose from 'mongoose';

// Conectar a MongoDB
await mongoose.connect('mongodb://localhost:27017/parnassus-academy-backend');

async function deepDatabaseInvestigation() {
  try {
    console.log('🔍 INVESTIGACIÓN PROFUNDA DE LA BASE DE DATOS');
    console.log('=' .repeat(60));
    
    const db = mongoose.connection.db;
    
    // Verificar todas las colecciones
    console.log('\n📋 TODAS LAS COLECCIONES:');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      console.log(`📁 ${col.name}`);
      
      // Verificar índices de cada colección
      if (col.name.includes('lesson')) {
        console.log(`   📋 Índices de ${col.name}:`);
        const indexes = await db.collection(col.name).indexes();
        indexes.forEach(index => {
          console.log(`      - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Verificar algunos documentos de ejemplo
        const sampleDocs = await db.collection(col.name).find({}).limit(3).toArray();
        console.log(`   📄 Documentos de ejemplo (${sampleDocs.length}):`);
        sampleDocs.forEach((doc, i) => {
          console.log(`      ${i + 1}. _id: ${doc._id}`);
          console.log(`         course: ${doc.course}, courseId: ${doc.courseId}`);
          console.log(`         module: ${doc.module}, moduleId: ${doc.moduleId}`);
          console.log(`         slug: ${doc.slug}, title: ${doc.title}`);
        });
      }
    }
    
    // Buscar específicamente en MongoDB sin pasar por Mongoose
    console.log('\n🔍 BÚSQUEDA DIRECTA EN MONGODB:');
    
    // Verificar si existe algún índice con courseId
    const allCollections = ['lessons', 'courses', 'modules'];
    for (const collectionName of allCollections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        const courseIdIndexes = indexes.filter(idx => 
          JSON.stringify(idx.key).includes('courseId') || 
          JSON.stringify(idx.key).includes('slug')
        );
        
        if (courseIdIndexes.length > 0) {
          console.log(`❌ ÍNDICES PROBLEMÁTICOS en ${collectionName}:`);
          courseIdIndexes.forEach(idx => {
            console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
          });
        } else {
          console.log(`✅ ${collectionName}: Sin índices problemáticos`);
        }
      } catch (error) {
        console.log(`⚠️ ${collectionName}: No existe o error: ${error.message}`);
      }
    }
    
    // Intentar crear un documento de prueba para ver dónde falla
    console.log('\n🧪 PRUEBA DE INSERCIÓN:');
    try {
      const testDoc = {
        course: new mongoose.Types.ObjectId('689c6f8efdb814fd5cae090c'),
        module: new mongoose.Types.ObjectId('689c7c8df6680a5db3a6bbec'),
        title: 'Prueba de Inserción',
        slug: 'prueba-insercion-' + Date.now(),
        index: 999,
        durationSec: 300,
        contentHtml: '<p>Prueba</p>',
        resources: []
      };
      
      console.log('📝 Intentando insertar documento de prueba...');
      console.log('   Datos:', JSON.stringify(testDoc, null, 2));
      
      const result = await db.collection('lessons').insertOne(testDoc);
      console.log('✅ Inserción exitosa:', result.insertedId);
      
      // Limpiar el documento de prueba
      await db.collection('lessons').deleteOne({ _id: result.insertedId });
      console.log('🧹 Documento de prueba eliminado');
      
    } catch (error) {
      console.log('❌ Error en la inserción:', error.message);
      console.log('   Código:', error.code);
      console.log('   Patrón de clave:', error.keyPattern);
      console.log('   Valor de clave:', error.keyValue);
    }
    
  } catch (error) {
    console.error('❌ Error en la investigación:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

deepDatabaseInvestigation();
