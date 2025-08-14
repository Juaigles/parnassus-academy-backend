# 📋 API REFERENCE COMPLETA
# PARNASSUS ACADEMY BACKEND - Referencia de Endpoints

## 🔗 Base URL
```
Development: http://localhost:3001/api
Production: https://api.parnassus-academy.com/api
```

## 🔑 Authentication Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>  # Para endpoints autenticados
```

---

## 🔐 AUTH ENDPOINTS

### POST /auth/register
**Descripción:** Registro de nuevo usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f7b8a9b12c3d4e5f6789ab",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login
**Descripción:** Autenticación de usuario
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "requires2FA": false
  }
}
```

### GET /auth/me
**Descripción:** Obtener usuario actual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 📚 COURSE ENDPOINTS

### GET /courses
**Descripción:** Listar cursos públicos
```http
GET /api/courses?page=1&limit=10&category=programming&level=beginner
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "64f7b8a9b12c3d4e5f6789ab",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from scratch",
        "price": 99.99,
        "currency": "EUR",
        "level": "beginner",
        "category": "programming",
        "thumbnail": "https://...",
        "teacher": {
          "id": "64f7b8a9b12c3d4e5f6789ac",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "stats": {
          "totalStudents": 1247,
          "averageRating": 4.8,
          "totalReviews": 203
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 145,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /courses
**Descripción:** Crear nuevo curso (Solo teachers)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced React Patterns",
  "description": "Master advanced React concepts",
  "category": "programming",
  "level": "advanced",
  "price": 149.99,
  "marketingInfo": {
    "tagline": "Build production-ready React apps",
    "features": ["Hooks", "Context", "Performance"],
    "targetAudience": "Intermediate React developers",
    "requirements": ["Basic React knowledge", "JavaScript ES6+"],
    "learningOutcomes": ["Master advanced patterns", "Optimize performance"]
  }
}
```

### GET /courses/:id
**Descripción:** Obtener curso específico
```http
GET /api/courses/64f7b8a9b12c3d4e5f6789ab
Authorization: Bearer <token>  # Optional
```

---

## 📖 MODULE & LESSON ENDPOINTS

### GET /courses/:courseId/modules
**Descripción:** Listar módulos de un curso
```http
GET /api/courses/64f7b8a9b12c3d4e5f6789ab/modules
```

### POST /modules
**Descripción:** Crear módulo (Solo teachers)
```http
POST /api/modules
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to Variables",
  "description": "Learn about variables in JavaScript",
  "courseId": "64f7b8a9b12c3d4e5f6789ab",
  "order": 1
}
```

### GET /modules/:moduleId/lessons
**Descripción:** Listar lecciones de un módulo
```http
GET /api/modules/64f7b8a9b12c3d4e5f6789ab/lessons
```

### POST /lessons
**Descripción:** Crear lección (Solo teachers)
```http
POST /api/lessons
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "What are Variables?",
  "description": "Understanding JavaScript variables",
  "content": "# Variables in JavaScript\n\nVariables are...",
  "moduleId": "64f7b8a9b12c3d4e5f6789ab",
  "courseId": "64f7b8a9b12c3d4e5f6789ac",
  "type": "text",
  "order": 1,
  "duration": 15
}
```

---

## 💰 PURCHASE ENDPOINTS

### POST /courses/:courseId/purchase
**Descripción:** Crear intención de compra
```http
POST /api/courses/64f7b8a9b12c3d4e5f6789ab/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890"  # Optional for Stripe
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abc123",
    "purchaseId": "64f7b8a9b12c3d4e5f6789ab"
  }
}
```

### GET /users/my-courses
**Descripción:** Obtener cursos del usuario
```http
GET /api/users/my-courses
Authorization: Bearer <token>
```

### GET /users/purchase-history
**Descripción:** Historial de compras
```http
GET /api/users/purchase-history
Authorization: Bearer <token>
```

---

## 🔒 TWO-FACTOR AUTH ENDPOINTS

### POST /advanced/2fa/generate
**Descripción:** Generar secreto 2FA
```http
POST /api/advanced/2fa/generate
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAA...",
    "backupCodes": ["12345678", "87654321", "13579246"]
  }
}
```

### POST /advanced/2fa/enable
**Descripción:** Activar 2FA
```http
POST /api/advanced/2fa/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

### POST /advanced/2fa/verify
**Descripción:** Verificar código 2FA
```http
POST /api/advanced/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

---

## 📊 ANALYTICS ENDPOINTS

### POST /advanced/analytics/track
**Descripción:** Registrar evento
```http
POST /api/advanced/analytics/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "course_started",
  "data": {
    "courseId": "64f7b8a9b12c3d4e5f6789ab",
    "timestamp": "2025-01-14T12:00:00.000Z"
  }
}
```

### GET /advanced/analytics/dashboard
**Descripción:** Dashboard de analytics (Admin/Teacher)
```http
GET /api/advanced/analytics/dashboard
Authorization: Bearer <token>
```

---

## 🔔 NOTIFICATION ENDPOINTS

### POST /advanced/notifications/send
**Descripción:** Enviar notificación (Admin)
```http
POST /api/advanced/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "course_update",
  "title": "New Content Available",
  "message": "New lesson added to JavaScript course",
  "recipientId": "64f7b8a9b12c3d4e5f6789ab"
}
```

### GET /advanced/notifications/stats
**Descripción:** Estadísticas de notificaciones
```http
GET /api/advanced/notifications/stats
Authorization: Bearer <token>
```

---

## 🔍 SEARCH ENDPOINTS

### GET /search/courses
**Descripción:** Buscar cursos
```http
GET /api/search/courses?q=javascript&category=programming&level=beginner&minPrice=0&maxPrice=100
```

---

## 🏆 QUIZ & CERTIFICATE ENDPOINTS

### POST /lessons/:lessonId/quiz
**Descripción:** Crear quiz para lección (Teacher)
```http
POST /api/lessons/64f7b8a9b12c3d4e5f6789ab/quiz
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Variables Quiz",
  "description": "Test your knowledge",
  "questions": [
    {
      "question": "What is a variable?",
      "type": "multiple-choice",
      "options": ["A container", "A function", "A loop", "A condition"],
      "correctAnswer": 0,
      "explanation": "Variables are containers for storing data"
    }
  ],
  "passingScore": 80,
  "timeLimit": 300
}
```

### GET /courses/:courseId/certificate
**Descripción:** Obtener certificado
```http
GET /api/courses/64f7b8a9b12c3d4e5f6789ab/certificate
Authorization: Bearer <token>
```

---

## 📱 PWA ENDPOINTS

### GET /manifest.json
**Descripción:** PWA Manifest
```http
GET /manifest.json
```

### GET /sw.js
**Descripción:** Service Worker
```http
GET /sw.js
```

---

## 👨‍💼 ADMIN ENDPOINTS

### GET /admin/health
**Descripción:** Health check del sistema
```http
GET /api/admin/health
Authorization: Bearer <token>  # Admin role required
```

### GET /admin/metrics
**Descripción:** Métricas del sistema
```http
GET /api/admin/metrics
Authorization: Bearer <token>  # Admin role required
```

### GET /admin/cache/stats
**Descripción:** Estadísticas de cache
```http
GET /api/admin/cache/stats
Authorization: Bearer <token>  # Admin role required
```

---

## ❌ ERROR RESPONSES

### Error Format
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate resource)
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

---

## 🚀 WebSocket Events

### Connection
```javascript
// Client connection
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Events
```javascript
// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Listen for course updates
socket.on('course_update', (data) => {
  console.log('Course updated:', data);
});

// Listen for progress sync
socket.on('progress_sync', (data) => {
  console.log('Progress synced:', data);
});
```

---

## 📊 Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| `/auth/*` | 5 requests | 15 minutes |
| `/purchase/*` | 3 requests | 15 minutes |
| `/api/*` (general) | 100 requests | 15 minutes |
| WebSocket connections | 5 per user | Always |

---

## 🔧 Query Parameters

### Pagination
```
?page=1&limit=10
```

### Sorting
```
?sort=createdAt&order=desc
```

### Filtering
```
?category=programming&level=beginner&minPrice=0&maxPrice=100
```

### Search
```
?q=javascript&search=title,description
```

---

## 📈 Response Metadata

### Standard Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "meta": {
    "timestamp": "2025-01-14T12:00:00.000Z",
    "requestId": "req_123456789",
    "processingTime": 45
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 95,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    }
  }
}
```

---

**API Reference actualizada**: 14 de Agosto 2025
**Versión API**: v3.0.0
