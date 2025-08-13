#!/usr/bin/env node

/**
 * Test simple para verificar el endpoint de marketing paso a paso
 */

async function simpleMarketingTest() {
  console.log('🔍 Test simple de marketing - Paso a paso\n');

  const API_BASE = 'http://localhost:3000/api';
  
  // Helper function
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

    console.log(`📤 ${method} ${endpoint}`);
    if (data) {
      console.log('   Body:', JSON.stringify(data, null, 2));
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      console.log(`📥 Status: ${response.status}`);
      console.log('   Response:', JSON.stringify(result, null, 2));
      
      return { status: response.status, data: result };
    } catch (error) {
      console.log('❌ Error:', error.message);
      return { status: 0, error: error.message };
    }
  }

  try {
    // 1. Login (usa un usuario existente o crea uno)
    console.log('1️⃣ Login...');
    const login = await apiRequest('POST', '/auth/login', {
      email: 'teacher@test.com', // Cambia por tu email
      password: 'password123'
    });

    if (login.status !== 200) {
      console.log('\n🔴 Login falló. Creando usuario...');
      const register = await apiRequest('POST', '/auth/register', {
        email: 'teacher@test.com',
        password: 'password123',
        name: 'Teacher Test',
        role: 'teacher'
      });
      
      if (register.status === 201) {
        console.log('✅ Usuario creado, intentando login...');
        const newLogin = await apiRequest('POST', '/auth/login', {
          email: 'teacher@test.com',
          password: 'password123'
        });
        
        if (newLogin.status !== 200) {
          console.log('❌ Login falló después del registro');
          return;
        }
        
        var token = newLogin.data.accessToken;
      } else {
        console.log('❌ No se pudo crear usuario');
        return;
      }
    } else {
      var token = login.data.accessToken;
    }

    console.log('\n2️⃣ Creando curso...');
    const course = await apiRequest('POST', '/courses', {
      title: 'Test Marketing Simple',
      description: 'Curso para probar marketing',
      category: 'technology',
      level: 'beginner',
      language: 'es'
    }, token);

    if (course.status !== 201) {
      console.log('❌ No se pudo crear el curso');
      return;
    }

    const courseId = course.data._id;
    console.log(`✅ Curso creado con ID: ${courseId}`);

    console.log('\n3️⃣ Verificando curso antes del marketing...');
    const beforeMarketing = await apiRequest('GET', `/courses/${courseId}`, null, token);
    console.log('Marketing antes:', beforeMarketing.data.marketing || 'undefined');

    console.log('\n4️⃣ Actualizando marketing...');
    const marketingUpdate = await apiRequest('PATCH', `/courses/${courseId}/marketing`, {
      card: {
        subtitle: 'Mi subtitle de prueba',
        learnOutcomes: ['Aprender A', 'Aprender B', 'Aprender C']
      }
    }, token);

    console.log('\n5️⃣ Verificando curso después del marketing...');
    const afterMarketing = await apiRequest('GET', `/courses/${courseId}`, null, token);
    console.log('Marketing después:', JSON.stringify(afterMarketing.data.marketing, null, 2));

    // Verificación final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const marketing = afterMarketing.data.marketing;
    if (marketing && marketing.card && marketing.card.subtitle) {
      console.log('✅ Marketing guardado correctamente');
      console.log(`   Subtitle: "${marketing.card.subtitle}"`);
      console.log(`   Learn outcomes: ${marketing.card.learnOutcomes?.length || 0} items`);
    } else {
      console.log('❌ Marketing NO se guardó correctamente');
      console.log('   Estructura actual:', marketing);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

simpleMarketingTest();
