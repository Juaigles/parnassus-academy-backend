#!/usr/bin/env node

/**
 * Script de prueba específico para el endpoint de marketing
 */

const API_BASE = 'http://localhost:3000/api';

// Función helper para hacer requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function testMarketingPatch() {
  console.log('🧪 Test de Marketing Patch - Deep Merge\n');

  // 1. Login para obtener token
  console.log('1. 🔐 Haciendo login...');
  const login = await apiRequest('POST', '/auth/login', {
    email: 'test@example.com', // Cambiar por tu email de prueba
    password: 'password123'
  });

  if (login.status !== 200) {
    console.log('❌ Error en login:', login);
    return;
  }

  const token = login.data.accessToken;
  console.log('✅ Login exitoso');

  // 2. Crear curso de prueba
  console.log('\n2. 📚 Creando curso de prueba...');
  const newCourse = await apiRequest('POST', '/courses', {
    title: 'Curso de Marketing Test',
    description: 'Curso para probar el marketing patch',
    category: 'technology',
    level: 'beginner',
    language: 'es'
  }, token);

  if (newCourse.status !== 201) {
    console.log('❌ Error creando curso:', newCourse);
    return;
  }

  const courseId = newCourse.data._id;
  console.log('✅ Curso creado:', courseId);

  // 3. Primera actualización de marketing - Info básica
  console.log('\n3. 🎨 Primera actualización - Info básica...');
  const firstUpdate = await apiRequest('PATCH', `/courses/${courseId}/marketing`, {
    card: {
      subtitle: 'Aprende marketing digital desde cero',
      learnOutcomes: [
        'Crear campañas efectivas',
        'Analizar métricas',
        'Optimizar conversiones'
      ]
    },
    hero: {
      previewUrl: 'https://example.com/preview.mp4'
    },
    goals: [
      {
        title: 'Objetivo Principal',
        description: 'Dominar el marketing digital moderno'
      }
    ]
  }, token);

  console.log('Status:', firstUpdate.status);
  if (firstUpdate.status === 200) {
    console.log('✅ Primera actualización exitosa');
    console.log('Marketing actual:', JSON.stringify(firstUpdate.data.marketing, null, 2));
  } else {
    console.log('❌ Error en primera actualización:', firstUpdate);
  }

  // 4. Segunda actualización - Agregar más info (debería hacer merge)
  console.log('\n4. 🔄 Segunda actualización - Merge con datos existentes...');
  const secondUpdate = await apiRequest('PATCH', `/courses/${courseId}/marketing`, {
    card: {
      coverImageUrl: 'https://example.com/cover.jpg',
      badges: ['Certificado', 'Online', 'Actualizado']
      // Note: NO incluimos subtitle ni learnOutcomes - deberían mantenerse
    },
    testimonials: [
      {
        quote: 'Excelente curso, muy completo',
        studentName: 'Juan Pérez',
        country: 'España'
      }
    ],
    faq: [
      {
        q: '¿Cuánto dura el curso?',
        a: 'El curso tiene una duración aproximada de 8 semanas'
      }
    ]
  }, token);

  console.log('Status:', secondUpdate.status);
  if (secondUpdate.status === 200) {
    console.log('✅ Segunda actualización exitosa');
    console.log('Marketing final:', JSON.stringify(secondUpdate.data.marketing, null, 2));
    
    // Verificar que se mantuvieron los datos anteriores
    const marketing = secondUpdate.data.marketing;
    
    console.log('\n🔍 Verificando merge:');
    console.log('- Subtitle mantenido:', marketing.card?.subtitle ? '✅' : '❌');
    console.log('- Learn outcomes mantenidos:', marketing.card?.learnOutcomes?.length > 0 ? '✅' : '❌');
    console.log('- Cover image añadido:', marketing.card?.coverImageUrl ? '✅' : '❌');
    console.log('- Badges añadidos:', marketing.card?.badges?.length > 0 ? '✅' : '❌');
    console.log('- Preview URL mantenido:', marketing.hero?.previewUrl ? '✅' : '❌');
    console.log('- Goals mantenidos:', marketing.goals?.length > 0 ? '✅' : '❌');
    console.log('- Testimonials añadidos:', marketing.testimonials?.length > 0 ? '✅' : '❌');
    console.log('- FAQ añadida:', marketing.faq?.length > 0 ? '✅' : '❌');
    
  } else {
    console.log('❌ Error en segunda actualización:', secondUpdate);
  }

  // 5. Tercera actualización - Sobrescribir array completo
  console.log('\n5. 🔄 Tercera actualización - Sobrescribir arrays...');
  const thirdUpdate = await apiRequest('PATCH', `/courses/${courseId}/marketing`, {
    card: {
      learnOutcomes: [
        'Nuevo outcome 1',
        'Nuevo outcome 2'
      ]
      // Esto debería reemplazar completamente el array anterior
    }
  }, token);

  console.log('Status:', thirdUpdate.status);
  if (thirdUpdate.status === 200) {
    console.log('✅ Tercera actualización exitosa');
    console.log('Learn outcomes actualizados:', thirdUpdate.data.marketing.card?.learnOutcomes);
  } else {
    console.log('❌ Error en tercera actualización:', thirdUpdate);
  }

  console.log('\n🎉 Test de marketing completado!');
}

// Ejecutar test
testMarketingPatch().catch(console.error);
