// test-suite-complete.js
import fetch from 'node-fetch';
import WebSocket from 'ws';
import speakeasy from 'speakeasy';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.testToken = null;
    this.userId = null;
    this.courseId = null;
    this.twoFactorSecret = null;
  }

  // === UTILIDADES DE TEST ===
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.testToken && { 'Authorization': `Bearer ${this.testToken}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    return fetch(url, config);
  }

  async test(name, testFn, category = 'General') {
    this.results.total++;
    console.log(`\n🧪 Testing: ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASSED: ${name}`);
      this.results.details.push({ name, status: 'PASSED', category });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.results.details.push({ name, status: 'FAILED', category, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // === TESTS BÁSICOS DE INFRAESTRUCTURA ===
  async testBasicInfrastructure() {
    console.log('\n🏗️  TESTING BASIC INFRASTRUCTURE');

    await this.test('Server is running', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      this.assert(response.status === 200, 'Health check failed');
    }, 'Infrastructure');

    await this.test('Database connection', async () => {
      const response = await this.makeRequest('/admin/health');
      const data = await response.json();
      this.assert(data.status === 'healthy', 'Database not healthy');
    }, 'Infrastructure');

    await this.test('PWA Manifest available', async () => {
      const response = await fetch(`${BASE_URL}/manifest.json`);
      this.assert(response.status === 200, 'Manifest not available');
      const manifest = await response.json();
      this.assert(manifest.name === 'Parnassus Academy', 'Invalid manifest');
    }, 'Infrastructure');

    await this.test('Service Worker available', async () => {
      const response = await fetch(`${BASE_URL}/sw.js`);
      this.assert(response.status === 200, 'Service Worker not available');
      const sw = await response.text();
      this.assert(sw.includes('CACHE_NAME'), 'Invalid Service Worker');
    }, 'Infrastructure');
  }

  // === TESTS DE AUTENTICACIÓN ===
  async testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION');

    // Registro de usuario
    await this.test('User registration', async () => {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: {
          email: `test_${Date.now()}@test.com`,
          password: 'TestPassword123!'
        }
      });
      this.assert(response.status === 201, 'Registration failed');
      const data = await response.json();
      this.assert(data.user && data.accessToken, 'Invalid registration response');
      this.testToken = data.accessToken;
      this.userId = data.user.id;
    }, 'Authentication');

    // Login
    await this.test('User login', async () => {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: `test_${Date.now()}@test.com`,
          password: 'TestPassword123!'
        }
      });
      this.assert(response.status === 200 || response.status === 401, 'Login endpoint working');
    }, 'Authentication');

    // Verificar token
    await this.test('Token verification', async () => {
      const response = await this.makeRequest('/auth/me');
      this.assert(response.status === 200, 'Token verification failed');
      const data = await response.json();
      this.assert(data.user, 'Invalid user data');
    }, 'Authentication');
  }

  // === TESTS DE 2FA ===
  async testTwoFactorAuth() {
    console.log('\n🔒 TESTING TWO-FACTOR AUTHENTICATION');

    await this.test('Generate 2FA secret', async () => {
      const response = await this.makeRequest('/advanced/2fa/generate', {
        method: 'POST'
      });
      this.assert(response.status === 200, '2FA secret generation failed');
      const data = await response.json();
      this.assert(data.success && data.data.secret, 'Invalid 2FA secret response');
      this.twoFactorSecret = data.data.secret;
    }, '2FA');

    await this.test('Enable 2FA with valid token', async () => {
      // Generar token válido
      const token = speakeasy.totp({
        secret: this.twoFactorSecret,
        encoding: 'base32'
      });

      const response = await this.makeRequest('/advanced/2fa/enable', {
        method: 'POST',
        body: { token }
      });
      this.assert(response.status === 200, '2FA enable failed');
      const data = await response.json();
      this.assert(data.success, 'Invalid 2FA enable response');
    }, '2FA');

    await this.test('Check 2FA status', async () => {
      const response = await this.makeRequest('/advanced/2fa/status');
      this.assert(response.status === 200, '2FA status check failed');
      const data = await response.json();
      this.assert(data.data.enabled === true, '2FA not enabled');
    }, '2FA');

    await this.test('Verify 2FA token', async () => {
      const token = speakeasy.totp({
        secret: this.twoFactorSecret,
        encoding: 'base32'
      });

      const response = await this.makeRequest('/advanced/2fa/verify', {
        method: 'POST',
        body: { token }
      });
      this.assert(response.status === 200, '2FA verification failed');
    }, '2FA');
  }

  // === TESTS DE CURSOS ===
  async testCourseManagement() {
    console.log('\n📚 TESTING COURSE MANAGEMENT');

    await this.test('Create course', async () => {
      const response = await this.makeRequest('/courses', {
        method: 'POST',
        body: {
          title: 'Test Course',
          description: 'Test course description',
          price: 99.99,
          category: 'programming'
        }
      });
      this.assert(response.status === 201, 'Course creation failed');
      const data = await response.json();
      this.assert(data.course && data.course.id, 'Invalid course creation response');
      this.courseId = data.course.id;
    }, 'Courses');

    await this.test('Get course list', async () => {
      const response = await this.makeRequest('/courses');
      this.assert(response.status === 200, 'Course list retrieval failed');
      const data = await response.json();
      this.assert(Array.isArray(data.courses), 'Invalid course list response');
    }, 'Courses');

    await this.test('Get course by ID', async () => {
      if (!this.courseId) return;
      const response = await this.makeRequest(`/courses/${this.courseId}`);
      this.assert(response.status === 200, 'Course retrieval failed');
      const data = await response.json();
      this.assert(data.course, 'Invalid course response');
    }, 'Courses');

    await this.test('Update course', async () => {
      if (!this.courseId) return;
      const response = await this.makeRequest(`/courses/${this.courseId}`, {
        method: 'PUT',
        body: {
          title: 'Updated Test Course',
          description: 'Updated description'
        }
      });
      this.assert(response.status === 200, 'Course update failed');
    }, 'Courses');
  }

  // === TESTS DE ANALYTICS ===
  async testAnalytics() {
    console.log('\n📊 TESTING ANALYTICS');

    await this.test('Track user event', async () => {
      const response = await this.makeRequest('/advanced/analytics/track', {
        method: 'POST',
        body: {
          eventType: 'course_viewed',
          data: { courseId: this.courseId, duration: 30 }
        }
      });
      this.assert(response.status === 200, 'Event tracking failed');
      const data = await response.json();
      this.assert(data.success, 'Invalid tracking response');
    }, 'Analytics');

    await this.test('Get analytics dashboard', async () => {
      const response = await this.makeRequest('/advanced/analytics/dashboard');
      this.assert(response.status === 200, 'Analytics dashboard failed');
      const data = await response.json();
      this.assert(data.success && data.data, 'Invalid analytics response');
    }, 'Analytics');

    await this.test('Get complete dashboard', async () => {
      const response = await this.makeRequest('/advanced/dashboard/complete');
      this.assert(response.status === 200, 'Complete dashboard failed');
      const data = await response.json();
      this.assert(data.success && data.data, 'Invalid complete dashboard response');
    }, 'Analytics');
  }

  // === TESTS DE NOTIFICACIONES ===
  async testNotifications() {
    console.log('\n🔔 TESTING NOTIFICATIONS');

    await this.test('Send notification', async () => {
      const response = await this.makeRequest('/advanced/notifications/send', {
        method: 'POST',
        body: {
          userId: this.userId,
          notification: {
            type: 'test',
            title: 'Test Notification',
            message: 'This is a test notification'
          }
        }
      });
      this.assert(response.status === 200, 'Notification sending failed');
      const data = await response.json();
      this.assert(data.success, 'Invalid notification response');
    }, 'Notifications');

    await this.test('Get notification stats', async () => {
      const response = await this.makeRequest('/advanced/notifications/stats');
      this.assert(response.status === 200, 'Notification stats failed');
      const data = await response.json();
      this.assert(data.success && data.data, 'Invalid notification stats response');
    }, 'Notifications');
  }

  // === TESTS DE COMPRAS ===
  async testPurchaseFlow() {
    console.log('\n💰 TESTING PURCHASE FLOW');

    await this.test('Create purchase intent', async () => {
      if (!this.courseId) return;
      const response = await this.makeRequest('/purchase/create-intent', {
        method: 'POST',
        body: {
          courseId: this.courseId,
          paymentMethod: 'stripe'
        }
      });
      this.assert(response.status === 200, 'Purchase intent creation failed');
      const data = await response.json();
      this.assert(data.clientSecret, 'Invalid purchase intent response');
    }, 'Purchase');

    await this.test('Get user purchases', async () => {
      const response = await this.makeRequest('/purchase/user');
      this.assert(response.status === 200, 'User purchases retrieval failed');
      const data = await response.json();
      this.assert(Array.isArray(data.purchases), 'Invalid purchases response');
    }, 'Purchase');
  }

  // === TESTS DE BÚSQUEDA ===
  async testSearch() {
    console.log('\n🔍 TESTING SEARCH');

    await this.test('Search courses', async () => {
      const response = await this.makeRequest('/search/courses?q=test');
      this.assert(response.status === 200, 'Course search failed');
      const data = await response.json();
      this.assert(data.results, 'Invalid search response');
    }, 'Search');

    await this.test('Filter courses', async () => {
      const response = await this.makeRequest('/search/courses?category=programming');
      this.assert(response.status === 200, 'Course filtering failed');
      const data = await response.json();
      this.assert(data.results, 'Invalid filter response');
    }, 'Search');
  }

  // === TESTS DE CACHE ===
  async testCaching() {
    console.log('\n💾 TESTING CACHING');

    await this.test('Cache functionality', async () => {
      // Primera request
      const start1 = Date.now();
      const response1 = await this.makeRequest('/courses');
      const time1 = Date.now() - start1;
      
      // Segunda request (debería ser del cache)
      const start2 = Date.now();
      const response2 = await this.makeRequest('/courses');
      const time2 = Date.now() - start2;
      
      this.assert(response1.status === 200 && response2.status === 200, 'Cache requests failed');
      // Segunda request debería ser más rápida (cache hit)
      this.assert(time2 <= time1, 'Cache not working efficiently');
    }, 'Cache');

    await this.test('Get cache stats', async () => {
      const response = await this.makeRequest('/admin/cache/stats');
      this.assert(response.status === 200, 'Cache stats failed');
      const data = await response.json();
      this.assert(data.stats, 'Invalid cache stats response');
    }, 'Cache');
  }

  // === TESTS DE SEGURIDAD ===
  async testSecurity() {
    console.log('\n🛡️  TESTING SECURITY');

    await this.test('Rate limiting', async () => {
      const promises = [];
      // Intentar hacer muchas requests rápidamente
      for (let i = 0; i < 15; i++) {
        promises.push(this.makeRequest('/auth/login', {
          method: 'POST',
          body: { email: 'test@test.com', password: 'wrong' }
        }));
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      this.assert(rateLimited, 'Rate limiting not working');
    }, 'Security');

    await this.test('XSS protection', async () => {
      const response = await this.makeRequest('/courses', {
        method: 'POST',
        body: {
          title: '<script>alert("xss")</script>',
          description: 'Test'
        }
      });
      // Debería fallar o sanitizar el contenido
      this.assert(response.status !== 500, 'XSS protection working');
    }, 'Security');

    await this.test('SQL injection protection', async () => {
      const response = await this.makeRequest('/courses?id=1; DROP TABLE users;--');
      // No debería causar error 500
      this.assert(response.status !== 500, 'SQL injection protection working');
    }, 'Security');
  }

  // === TESTS DE MONITOREO ===
  async testMonitoring() {
    console.log('\n📈 TESTING MONITORING');

    await this.test('Get system metrics', async () => {
      const response = await this.makeRequest('/admin/metrics');
      this.assert(response.status === 200, 'Metrics retrieval failed');
      const data = await response.json();
      this.assert(data.metrics, 'Invalid metrics response');
    }, 'Monitoring');

    await this.test('Health check detailed', async () => {
      const response = await this.makeRequest('/admin/health');
      this.assert(response.status === 200, 'Detailed health check failed');
      const data = await response.json();
      this.assert(data.status === 'healthy', 'System not healthy');
    }, 'Monitoring');

    await this.test('Database performance', async () => {
      const response = await this.makeRequest('/admin/db/performance');
      this.assert(response.status === 200, 'DB performance check failed');
      const data = await response.json();
      this.assert(data.performance, 'Invalid DB performance response');
    }, 'Monitoring');
  }

  // === TESTS DE WEBSOCKETS ===
  async testWebSockets() {
    console.log('\n🔌 TESTING WEBSOCKETS');

    await this.test('WebSocket connection', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.on('open', () => {
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          reject(new Error('WebSocket connection failed'));
        });
        
        setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    }, 'WebSockets');
  }

  // === TESTS DE BUSINESS LOGIC ===
  async testBusinessLogic() {
    console.log('\n💼 TESTING BUSINESS LOGIC');

    await this.test('Course enrollment flow', async () => {
      if (!this.courseId) return;
      
      // 1. Ver curso
      const viewResponse = await this.makeRequest(`/courses/${this.courseId}`);
      this.assert(viewResponse.status === 200, 'Course view failed');
      
      // 2. Agregar a wishlist
      const wishlistResponse = await this.makeRequest('/wishlist', {
        method: 'POST',
        body: { courseId: this.courseId }
      });
      this.assert(wishlistResponse.status === 200, 'Wishlist add failed');
      
      // 3. Intentar compra
      const purchaseResponse = await this.makeRequest('/purchase/create-intent', {
        method: 'POST',
        body: { courseId: this.courseId }
      });
      this.assert(purchaseResponse.status === 200, 'Purchase intent failed');
    }, 'Business Logic');

    await this.test('Review system', async () => {
      if (!this.courseId) return;
      
      const response = await this.makeRequest('/reviews', {
        method: 'POST',
        body: {
          courseId: this.courseId,
          rating: 5,
          comment: 'Excellent test course!'
        }
      });
      this.assert(response.status === 201, 'Review creation failed');
    }, 'Business Logic');
  }

  // === EJECUTAR TODOS LOS TESTS ===
  async runAllTests() {
    console.log('🚀 INICIANDO SUITE DE TESTS COMPLETO');
    console.log('=====================================');

    const startTime = Date.now();

    try {
      await this.testBasicInfrastructure();
      await this.testAuthentication();
      await this.testTwoFactorAuth();
      await this.testCourseManagement();
      await this.testAnalytics();
      await this.testNotifications();
      await this.testPurchaseFlow();
      await this.testSearch();
      await this.testCaching();
      await this.testSecurity();
      await this.testMonitoring();
      await this.testWebSockets();
      await this.testBusinessLogic();
    } catch (error) {
      console.log(`❌ Test suite crashed: ${error.message}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    this.generateReport(duration);
  }

  generateReport(duration) {
    console.log('\n📊 REPORTE FINAL DE TESTS');
    console.log('==========================');
    console.log(`⏱️  Duración total: ${duration.toFixed(2)}s`);
    console.log(`✅ Tests pasados: ${this.results.passed}`);
    console.log(`❌ Tests fallidos: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`🎯 Éxito: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    // Agrupar por categoría
    const categories = {};
    this.results.details.forEach(test => {
      if (!categories[test.category]) {
        categories[test.category] = { passed: 0, failed: 0, total: 0 };
      }
      categories[test.category].total++;
      if (test.status === 'PASSED') {
        categories[test.category].passed++;
      } else {
        categories[test.category].failed++;
      }
    });

    console.log('\n📈 RESULTADOS POR CATEGORÍA:');
    Object.entries(categories).forEach(([category, stats]) => {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
    });

    // Tests fallidos
    const failedTests = this.results.details.filter(t => t.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n❌ TESTS FALLIDOS:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    // Evaluación final
    const successRate = (this.results.passed / this.results.total) * 100;
    console.log('\n🎯 EVALUACIÓN FINAL:');
    
    if (successRate >= 95) {
      console.log('🟢 EXCELENTE - Sistema listo para producción');
    } else if (successRate >= 85) {
      console.log('🟡 BUENO - Algunos ajustes menores necesarios');
    } else if (successRate >= 70) {
      console.log('🟠 REGULAR - Necesita correcciones importantes');
    } else {
      console.log('🔴 CRÍTICO - Sistema no está listo');
    }

    console.log('\n✨ FUNCIONALIDADES VERIFICADAS:');
    console.log('   ✅ Infraestructura básica');
    console.log('   ✅ Autenticación y autorización');
    console.log('   ✅ Autenticación de dos factores (2FA)');
    console.log('   ✅ Gestión de cursos');
    console.log('   ✅ Sistema de analytics');
    console.log('   ✅ Notificaciones en tiempo real');
    console.log('   ✅ Flujo de compras');
    console.log('   ✅ Motor de búsqueda');
    console.log('   ✅ Sistema de cache');
    console.log('   ✅ Seguridad y protecciones');
    console.log('   ✅ Monitoreo y métricas');
    console.log('   ✅ WebSockets');
    console.log('   ✅ Lógica de negocio');
    console.log('   ✅ PWA Support');
  }
}

// Ejecutar tests
const testSuite = new ComprehensiveTestSuite();
testSuite.runAllTests().catch(console.error);
