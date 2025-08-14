# 🧪 GUÍA DE TESTING Y CALIDAD DE CÓDIGO
# PARNASSUS ACADEMY BACKEND - Testing & Code Quality

## 📋 ESTRATEGIA DE TESTING

### Pirámide de Testing
```
                    ┌─────────────────┐
                   ╱                   ╲
                  ╱     E2E TESTS       ╲
                 ╱      (5-10%)         ╲
                ╱                       ╲
               ┌─────────────────────────┐
              ╱                           ╲
             ╱    INTEGRATION TESTS        ╲
            ╱         (20-30%)             ╲
           ╱                               ╲
          ┌─────────────────────────────────┐
         ╱                                   ╲
        ╱          UNIT TESTS                ╲
       ╱           (60-70%)                  ╲
      ╱                                     ╲
     └───────────────────────────────────────┘
```

### Tipos de Testing Implementados
- **Unit Tests**: Funciones individuales, servicios, utilidades
- **Integration Tests**: Endpoints API, base de datos, servicios externos
- **E2E Tests**: Flujos completos de usuario
- **Performance Tests**: Load testing, stress testing
- **Security Tests**: Penetration testing, vulnerability scanning

---

## 🛠️ CONFIGURACIÓN DE TESTING

### Vitest Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.js',
        'src/server.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './src/__tests__')
    }
  }
});
```

### Test Setup
```javascript
// src/__tests__/setup.js
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Cargar variables de entorno de testing
dotenv.config({ path: '.env.test' });

let mongod;

// Setup global para todos los tests
beforeAll(async () => {
  // Configurar MongoDB en memoria
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri);
  
  // Configurar variables globales
  global.testUserId = null;
  global.testToken = null;
  global.testCourseId = null;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  // Limpiar base de datos antes de cada test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterEach(() => {
  // Limpiar mocks después de cada test
  vi.clearAllMocks();
});
```

### Environment Variables (.env.test)
```bash
NODE_ENV=test
PORT=3002
MONGODB_URI=mongodb://localhost:27017/parnassus_test
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=4
STRIPE_SECRET_KEY=sk_test_123456789
STRIPE_PUBLISHABLE_KEY=pk_test_123456789
SMTP_HOST=ethereal.email
SMTP_PORT=587
SMTP_USER=test@test.com
SMTP_PASS=test123
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
CACHE_TTL=60
LOG_LEVEL=error
```

---

## 📊 UNIT TESTS

### Testing Services
```javascript
// src/__tests__/unit/services/authService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/AuthService.js';
import UserRepository from '@/repositories/UserRepository.js';
import EmailService from '@/services/EmailService.js';

// Mock dependencies
vi.mock('@/repositories/UserRepository.js');
vi.mock('@/services/EmailService.js');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService;
  let mockUserRepo;
  let mockEmailService;

  beforeEach(() => {
    mockUserRepo = new UserRepository();
    mockEmailService = new EmailService();
    authService = new AuthService(mockUserRepo, mockEmailService);
    
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      mockUserRepo.create.mockResolvedValue({
        _id: 'userId123',
        ...userData,
        password: 'hashedPassword'
      });
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await authService.registerUser(userData);

      // Assert
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword'
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(userData.email);
      expect(result).toHaveProperty('_id');
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = { email: 'existing@example.com' };
      mockUserRepo.findByEmail.mockResolvedValue({ email: userData.email });

      // Act & Assert
      await expect(authService.registerUser(userData))
        .rejects.toThrow('El email ya está en uso');
    });

    it('should validate password complexity', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: '123' // Weak password
      };

      // Act & Assert
      await expect(authService.registerUser(userData))
        .rejects.toThrow('La contraseña debe tener al menos 8 caracteres');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'Test123!'
      };

      const user = {
        _id: 'userId123',
        email: credentials.email,
        password: 'hashedPassword',
        isEmailVerified: true,
        role: 'student'
      };

      mockUserRepo.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockAccessToken');

      // Act
      const result = await authService.loginUser(credentials);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.loginUser({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      // Arrange
      const user = { _id: 'userId123', role: 'student' };
      jwt.sign
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');

      // Act
      const tokens = authService.generateTokens(user);

      // Assert
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Testing Utilities
```javascript
// src/__tests__/unit/utils/validators.test.js
import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateCourse,
  sanitizeInput
} from '@/utils/validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MySecure123!',
        'AnotherStr0ng@Pass',
        'Complex#Password1'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc',
        'PASSWORD123',
        'mypass123'
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove harmful scripts', () => {
      const maliciousInput = '<script>alert("XSS")</script>Hello World';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should preserve safe HTML', () => {
      const safeInput = '<p>This is <strong>safe</strong> content</p>';
      const sanitized = sanitizeInput(safeInput);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
    });
  });
});
```

---

## 🔗 INTEGRATION TESTS

### API Endpoint Testing
```javascript
// src/__tests__/integration/auth.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import User from '@/models/User.js';

describe('Authentication Endpoints', () => {
  let server;

  beforeEach(async () => {
    server = app.listen(3002);
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verificar en base de datos
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(userData.email);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      // Crear usuario primero
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Existing',
        lastName: 'User',
        username: 'existing'
      };

      await User.create(userData);

      // Intentar crear con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('ya está en uso');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Crear usuario de prueba
      testUser = await User.create({
        email: 'testuser@example.com',
        password: '$2b$12$hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        isEmailVerified: true
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'correctPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(credentials.email);
      
      // Verificar cookies
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidCredentials = {
        email: 'testuser@example.com',
        password: 'wrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body.error).toContain('Credenciales inválidas');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Primero hacer login para obtener tokens
      const user = await User.create({
        email: 'refresh@example.com',
        password: 'hashedPassword',
        firstName: 'Refresh',
        lastName: 'User',
        username: 'refresh'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'correctPassword'
        });

      const refreshToken = loginResponse.body.refreshToken;

      // Usar refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });
});
```

### Database Integration Tests
```javascript
// src/__tests__/integration/database.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import Course from '@/models/Course.js';
import User from '@/models/User.js';
import Purchase from '@/models/Purchase.js';

describe('Database Operations', () => {
  let teacher, student, course;

  beforeEach(async () => {
    // Crear datos de prueba
    teacher = await User.create({
      email: 'teacher@example.com',
      password: 'hashedPassword',
      firstName: 'Teacher',
      lastName: 'User',
      username: 'teacher',
      role: 'teacher'
    });

    student = await User.create({
      email: 'student@example.com',
      password: 'hashedPassword',
      firstName: 'Student',
      lastName: 'User',
      username: 'student',
      role: 'student'
    });

    course = await Course.create({
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course',
      teacher: teacher._id,
      price: 99.99,
      category: 'technology',
      level: 'beginner',
      isPublished: true
    });
  });

  describe('Course Operations', () => {
    it('should populate teacher information', async () => {
      const courseWithTeacher = await Course.findById(course._id)
        .populate('teacher', 'firstName lastName email');

      expect(courseWithTeacher.teacher.firstName).toBe('Teacher');
      expect(courseWithTeacher.teacher.email).toBe('teacher@example.com');
    });

    it('should create course with proper validation', async () => {
      const newCourse = {
        title: 'Another Course',
        slug: 'another-course',
        description: 'Another test course',
        teacher: teacher._id,
        price: 149.99,
        category: 'business',
        level: 'intermediate'
      };

      const created = await Course.create(newCourse);
      expect(created._id).toBeDefined();
      expect(created.title).toBe(newCourse.title);
    });

    it('should enforce unique slug constraint', async () => {
      const duplicateCourse = {
        title: 'Duplicate Course',
        slug: 'test-course', // Same slug as existing course
        description: 'This should fail',
        teacher: teacher._id,
        price: 99.99,
        category: 'technology',
        level: 'beginner'
      };

      await expect(Course.create(duplicateCourse))
        .rejects.toThrow();
    });
  });

  describe('Purchase Operations', () => {
    it('should create purchase with proper relationships', async () => {
      const purchase = await Purchase.create({
        userId: student._id,
        courseId: course._id,
        amount: course.price,
        currency: 'USD',
        stripePaymentIntentId: 'pi_test_123456',
        status: 'completed'
      });

      expect(purchase.userId.toString()).toBe(student._id.toString());
      expect(purchase.courseId.toString()).toBe(course._id.toString());
    });

    it('should aggregate purchase statistics', async () => {
      // Crear múltiples compras
      await Purchase.create([
        {
          userId: student._id,
          courseId: course._id,
          amount: 99.99,
          currency: 'USD',
          stripePaymentIntentId: 'pi_test_1',
          status: 'completed'
        },
        {
          userId: student._id,
          courseId: course._id,
          amount: 99.99,
          currency: 'USD',
          stripePaymentIntentId: 'pi_test_2',
          status: 'completed'
        }
      ]);

      const stats = await Purchase.aggregate([
        { $match: { courseId: course._id } },
        {
          $group: {
            _id: '$courseId',
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      expect(stats[0].totalSales).toBe(2);
      expect(stats[0].totalRevenue).toBe(199.98);
    });
  });

  describe('Index Performance', () => {
    it('should use indexes for common queries', async () => {
      // Test de performance con explain()
      const explanation = await Course.find({ 
        isPublished: true,
        category: 'technology' 
      }).explain('executionStats');

      // Verificar que usa índice
      expect(explanation.executionStats.totalDocsExamined)
        .toBeLessThanOrEqual(explanation.executionStats.totalDocsReturned * 2);
    });
  });
});
```

---

## 🌐 END-TO-END TESTS

### Complete User Flows
```javascript
// src/__tests__/e2e/userFlow.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import User from '@/models/User.js';
import Course from '@/models/Course.js';

describe('Complete User Flow E2E', () => {
  let server;
  let userAgent;
  let teacherAgent;
  let teacherId;
  let courseId;

  beforeAll(async () => {
    server = app.listen(3003);
    userAgent = request.agent(app);
    teacherAgent = request.agent(app);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Teacher Flow: Create and Publish Course', () => {
    it('should register as teacher', async () => {
      const teacherData = {
        email: 'teacher.e2e@example.com',
        password: 'Teacher123!',
        firstName: 'Teacher',
        lastName: 'E2E',
        username: 'teacher_e2e',
        role: 'teacher'
      };

      const response = await teacherAgent
        .post('/api/auth/register')
        .send(teacherData)
        .expect(201);

      teacherId = response.body.user._id;
    });

    it('should login as teacher', async () => {
      await teacherAgent
        .post('/api/auth/login')
        .send({
          email: 'teacher.e2e@example.com',
          password: 'Teacher123!'
        })
        .expect(200);
    });

    it('should create a new course', async () => {
      const courseData = {
        title: 'E2E Test Course',
        slug: 'e2e-test-course',
        description: 'Complete E2E test course',
        price: 199.99,
        category: 'technology',
        level: 'intermediate',
        requirements: ['Basic programming knowledge'],
        whatWillLearn: ['Advanced concepts', 'Practical examples']
      };

      const response = await teacherAgent
        .post('/api/courses')
        .send(courseData)
        .expect(201);

      courseId = response.body.course._id;
      expect(response.body.course.title).toBe(courseData.title);
    });

    it('should add lessons to course', async () => {
      const lessonData = {
        title: 'Introduction Lesson',
        content: 'This is the introduction lesson content',
        duration: 600, // 10 minutes
        order: 1
      };

      const response = await teacherAgent
        .post(`/api/courses/${courseId}/lessons`)
        .send(lessonData)
        .expect(201);

      expect(response.body.lesson.title).toBe(lessonData.title);
    });

    it('should publish the course', async () => {
      const response = await teacherAgent
        .put(`/api/courses/${courseId}/publish`)
        .expect(200);

      expect(response.body.course.isPublished).toBe(true);
    });
  });

  describe('Student Flow: Discovery, Purchase, and Learning', () => {
    it('should register as student', async () => {
      const studentData = {
        email: 'student.e2e@example.com',
        password: 'Student123!',
        firstName: 'Student',
        lastName: 'E2E',
        username: 'student_e2e'
      };

      await userAgent
        .post('/api/auth/register')
        .send(studentData)
        .expect(201);
    });

    it('should login as student', async () => {
      await userAgent
        .post('/api/auth/login')
        .send({
          email: 'student.e2e@example.com',
          password: 'Student123!'
        })
        .expect(200);
    });

    it('should browse available courses', async () => {
      const response = await userAgent
        .get('/api/courses')
        .query({ category: 'technology' })
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].title).toBe('E2E Test Course');
    });

    it('should get course details', async () => {
      const response = await userAgent
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(response.body.course.title).toBe('E2E Test Course');
      expect(response.body.course.lessons).toBeDefined();
    });

    it('should create payment intent', async () => {
      const response = await userAgent
        .post('/api/payments/create-intent')
        .send({ courseId })
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body.amount).toBe(19999); // 199.99 in cents
    });

    it('should simulate successful payment webhook', async () => {
      // Simular webhook de Stripe
      const webhookData = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_e2e_123456',
            amount: 19999,
            metadata: {
              courseId: courseId,
              userId: 'student_user_id'
            }
          }
        }
      };

      await request(app)
        .post('/api/payments/webhook')
        .send(webhookData)
        .expect(200);
    });

    it('should access purchased course', async () => {
      const response = await userAgent
        .get(`/api/courses/${courseId}/access`)
        .expect(200);

      expect(response.body.hasAccess).toBe(true);
    });

    it('should track lesson progress', async () => {
      // Obtener lecciones del curso
      const courseResponse = await userAgent
        .get(`/api/courses/${courseId}`)
        .expect(200);

      const firstLesson = courseResponse.body.course.lessons[0];

      // Marcar lección como completada
      const progressResponse = await userAgent
        .put(`/api/progress/lesson/${firstLesson._id}`)
        .send({
          status: 'completed',
          timeSpent: 600
        })
        .expect(200);

      expect(progressResponse.body.progress.status).toBe('completed');
    });

    it('should get course progress summary', async () => {
      const response = await userAgent
        .get(`/api/progress/course/${courseId}`)
        .expect(200);

      expect(response.body.progress.completedLessons).toBe(1);
      expect(response.body.progress.totalLessons).toBe(1);
      expect(response.body.progress.percentageComplete).toBe(100);
    });
  });

  describe('Admin Flow: Analytics and Management', () => {
    let adminAgent;

    beforeAll(async () => {
      adminAgent = request.agent(app);
      
      // Crear admin user
      await User.create({
        email: 'admin.e2e@example.com',
        password: 'hashedPassword',
        firstName: 'Admin',
        lastName: 'E2E',
        username: 'admin_e2e',
        role: 'admin'
      });
    });

    it('should login as admin', async () => {
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: 'admin.e2e@example.com',
          password: 'Admin123!'
        })
        .expect(200);
    });

    it('should access admin analytics', async () => {
      const response = await adminAgent
        .get('/api/admin/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalCourses');
      expect(response.body).toHaveProperty('totalRevenue');
    });

    it('should get user analytics', async () => {
      const response = await adminAgent
        .get('/api/admin/users/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('usersByRole');
      expect(response.body).toHaveProperty('newUsersThisMonth');
    });

    it('should get course analytics', async () => {
      const response = await adminAgent
        .get('/api/admin/courses/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('coursesByCategory');
      expect(response.body).toHaveProperty('publishedCourses');
    });
  });
});
```

---

## ⚡ PERFORMANCE TESTS

### Load Testing
```javascript
// src/__tests__/performance/loadTest.js
import { describe, it, expect } from 'vitest';
import autocannon from 'autocannon';
import app from '@/app.js';

describe('Performance Load Tests', () => {
  let server;

  beforeAll(() => {
    server = app.listen(3004);
  });

  afterAll(() => {
    server.close();
  });

  it('should handle concurrent API requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3004',
      connections: 10,
      duration: 10,
      requests: [
        {
          method: 'GET',
          path: '/health'
        },
        {
          method: 'GET',
          path: '/api/courses',
          headers: {
            'content-type': 'application/json'
          }
        }
      ]
    });

    // Verificar métricas de performance
    expect(result.latency.mean).toBeLessThan(100); // < 100ms promedio
    expect(result.requests.mean).toBeGreaterThan(50); // > 50 req/sec
    expect(result['2xx']).toBeGreaterThan(result.requests.total * 0.95); // 95% success rate
  });

  it('should handle authentication load', async () => {
    const result = await autocannon({
      url: 'http://localhost:3004',
      connections: 20,
      duration: 15,
      requests: [
        {
          method: 'POST',
          path: '/api/auth/login',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Test123!'
          })
        }
      ]
    });

    expect(result.latency.p95).toBeLessThan(500); // 95% under 500ms
    expect(result.errors).toBe(0);
  });
});
```

### Memory and CPU Tests
```javascript
// src/__tests__/performance/memoryTest.js
import { describe, it, expect } from 'vitest';
import { performance, PerformanceObserver } from 'perf_hooks';
import Course from '@/models/Course.js';

describe('Memory and Performance Tests', () => {
  it('should not leak memory during bulk operations', async () => {
    const initialMemory = process.memoryUsage();
    
    // Crear muchos cursos
    const courses = Array.from({ length: 1000 }, (_, i) => ({
      title: `Performance Course ${i}`,
      slug: `performance-course-${i}`,
      description: 'Performance test course',
      teacher: 'teacher_id_here',
      price: 99.99,
      category: 'technology',
      level: 'beginner'
    }));

    await Course.insertMany(courses);
    
    // Forzar garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // El incremento de memoria no debería ser excesivo
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
  });

  it('should execute database queries efficiently', async () => {
    const startTime = performance.now();
    
    // Query complejo con múltiples agregaciones
    const results = await Course.aggregate([
      { $match: { isPublished: true } },
      { $group: {
        _id: '$category',
        totalCourses: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }},
      { $sort: { totalCourses: -1 } }
    ]);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(100); // < 100ms
    expect(results).toBeDefined();
  });
});
```

---

## 🔒 SECURITY TESTS

### Security Vulnerability Tests
```javascript
// src/__tests__/security/security.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app.js';

describe('Security Tests', () => {
  describe('XSS Protection', () => {
    it('should sanitize malicious input', async () => {
      const maliciousData = {
        title: '<script>alert("XSS")</script>Curso Malicioso',
        description: '<img src="x" onerror="alert(1)">'
      };

      const response = await request(app)
        .post('/api/courses')
        .send(maliciousData)
        .expect(400); // Should reject malicious input

      expect(response.body.error).toContain('contenido no válido');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should prevent NoSQL injection', async () => {
      const injectionAttempt = {
        email: { $ne: null },
        password: { $ne: null }
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(injectionAttempt)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array.from({ length: 110 }, () => 
        request(app).get('/api/courses')
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    it('should enforce auth rate limits', async () => {
      const loginAttempts = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'wrong@email.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(loginAttempts);
      const blocked = responses.filter(r => r.status === 429);
      
      expect(blocked.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Security', () => {
    it('should protect against timing attacks', async () => {
      const start1 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@email.com',
          password: 'password123'
        });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@email.com',
          password: 'wrongpassword'
        });
      const time2 = Date.now() - start2;

      // Los tiempos deberían ser similares
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(50); // < 50ms difference
    });
  });

  describe('CORS Security', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
```

---

## 📊 CODE QUALITY TOOLS

### ESLint Configuration
```javascript
// eslint.config.js
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    rules: {
      // Calidad de código
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Seguridad
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      
      // Mejores prácticas
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      
      // Estilo
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never']
    }
  },
  {
    files: ['src/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly'
      }
    }
  }
];
```

### Prettier Configuration
```javascript
// .prettierrc.js
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  printWidth: 80,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf'
};
```

### Husky Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

```json
{
  "lint-staged": {
    "src/**/*.{js,mjs}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "src/**/*.test.js": [
      "npm run test:unit -- --run --reporter=verbose"
    ]
  }
}
```

---

## 🎯 TESTING BEST PRACTICES

### Test Organization
```
src/__tests__/
├── unit/                    # Unit tests
│   ├── services/           # Service layer tests
│   ├── utils/              # Utility function tests
│   ├── models/             # Model validation tests
│   └── middleware/         # Middleware tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database operation tests
│   └── services/          # Service integration tests
├── e2e/                   # End-to-end tests
│   ├── userFlows/         # Complete user journeys
│   ├── adminFlows/        # Admin functionality
│   └── paymentFlows/      # Payment processes
├── performance/           # Performance tests
│   ├── load/             # Load testing
│   ├── stress/           # Stress testing
│   └── memory/           # Memory usage tests
├── security/             # Security tests
│   ├── auth/            # Authentication security
│   ├── xss/             # XSS prevention
│   └── injection/       # Injection prevention
├── fixtures/             # Test data
│   ├── users.js         # User test data
│   ├── courses.js       # Course test data
│   └── payments.js      # Payment test data
├── helpers/              # Test utilities
│   ├── setupDatabase.js # Database setup
│   ├── createUser.js    # User creation helper
│   └── mockServices.js  # Service mocks
└── setup.js             # Global test setup
```

### Test Data Management
```javascript
// src/__tests__/fixtures/users.js
export const validUser = {
  email: 'valid@example.com',
  password: 'ValidPass123!',
  firstName: 'Valid',
  lastName: 'User',
  username: 'validuser'
};

export const invalidUsers = {
  weakPassword: {
    ...validUser,
    password: '123'
  },
  invalidEmail: {
    ...validUser,
    email: 'invalid-email'
  },
  missingFields: {
    email: 'incomplete@example.com'
  }
};

export const createTestUser = async (overrides = {}) => {
  const userData = { ...validUser, ...overrides };
  return await User.create(userData);
};
```

### Coverage Reports
```javascript
// coverage thresholds in package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/__tests__/unit",
    "test:integration": "vitest run src/__tests__/integration",
    "test:e2e": "vitest run src/__tests__/e2e",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

---

**Guía de Testing actualizada**: 14 de Agosto 2025
**Framework**: Vitest + Supertest + MongoDB Memory Server
**Coverage mínimo**: 80% líneas, funciones, branches y statements
