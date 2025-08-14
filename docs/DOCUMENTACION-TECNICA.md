# 📚 DOCUMENTACIÓN TÉCNICA OFICIAL
# PARNASSUS ACADEMY BACKEND API v3.0.0

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico
- **Runtime**: Node.js 18+ con ES Modules
- **Framework**: Express.js 4.19.2
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT + 2FA (TOTP)
- **Pagos**: Stripe Integration
- **WebSockets**: Socket.IO
- **Logging**: Pino (structured logging)
- **Seguridad**: Helmet, XSS protection, Rate limiting
- **Cache**: In-memory caching con invalidación inteligente
- **Testing**: Suite de tests automatizado

### Estructura del Proyecto
```
src/
├── config/          # Configuraciones (DB, env, etc.)
├── controllers/     # Lógica de negocio por endpoint
├── libs/           # Librerías y utilidades compartidas
├── middlewares/    # Middlewares customizados
├── models/         # Modelos de Mongoose
├── repositories/   # Capa de acceso a datos
├── routes/         # Definición de rutas por módulo
├── scripts/        # Scripts de mantenimiento
├── services/       # Servicios de negocio
├── utils/          # Utilidades generales
├── validators/     # Schemas de validación Zod
└── server.js       # Entry point principal
```

---

## 🗃️ MODELOS DE DATOS

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed with bcrypt),
  firstName: String,
  lastName: String,
  role: String (enum: ['student', 'teacher', 'admin']),
  isVerified: Boolean,
  avatar: String (URL),
  profile: {
    bio: String,
    website: String,
    social: {
      linkedin: String,
      twitter: String,
      github: String
    }
  },
  preferences: {
    language: String,
    notifications: Boolean,
    theme: String
  },
  twoFactor: {
    enabled: Boolean,
    secret: String,
    backupCodes: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Course Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  slug: String (unique),
  description: String,
  teacher: ObjectId (ref: 'User'),
  category: String (enum categories),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  price: Number,
  currency: String (default: 'EUR'),
  thumbnail: String (URL),
  trailer: String (URL),
  isPublished: Boolean,
  status: String (enum: ['draft', 'pending_review', 'published']),
  marketingInfo: {
    tagline: String,
    features: [String],
    targetAudience: String,
    requirements: [String],
    learningOutcomes: [String]
  },
  syllabus: String (auto-generated),
  stats: {
    totalStudents: Number,
    averageRating: Number,
    totalReviews: Number,
    totalDuration: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Module Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  courseId: ObjectId (ref: 'Course'),
  order: Number,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Lesson Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  content: String (markdown),
  moduleId: ObjectId (ref: 'Module'),
  courseId: ObjectId (ref: 'Course'),
  order: Number,
  type: String (enum: ['video', 'text', 'quiz']),
  videoUrl: String,
  duration: Number (minutes),
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Purchase Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  courseId: ObjectId (ref: 'Course'),
  amount: Number,
  currency: String,
  stripePaymentIntentId: String,
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  paymentMethod: String,
  refundInfo: {
    reason: String,
    processedAt: Date,
    amount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 ENDPOINTS DOCUMENTATION

### 🔐 Authentication Endpoints

#### POST /api/auth/register
**Descripción**: Registro de nuevo usuario
**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f7b8a9b12c3d4e5f6789ab",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/login
**Descripción**: Autenticación de usuario
**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response 200**:
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

#### GET /api/auth/me
**Headers**: `Authorization: Bearer <token>`
**Descripción**: Obtener información del usuario autenticado
**Response 200**:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ }
  }
}
```

### 📚 Course Management Endpoints

#### GET /api/courses
**Descripción**: Listar cursos públicos (con cache)
**Query Parameters**:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `category`: Filtrar por categoría
- `level`: Filtrar por nivel
- `search`: Búsqueda por texto

**Response 200**:
```json
{
  "success": true,
  "data": {
    "courses": [ /* array of courses */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/courses
**Headers**: `Authorization: Bearer <token>` (role: teacher)
**Descripción**: Crear nuevo curso
**Body**:
```json
{
  "title": "Curso de JavaScript Avanzado",
  "description": "Aprende JavaScript desde cero",
  "category": "programming",
  "level": "intermediate",
  "price": 99.99
}
```

#### GET /api/courses/:id
**Headers**: `Authorization: Bearer <token>` (optional)
**Descripción**: Obtener curso por ID
**Response 200**:
```json
{
  "success": true,
  "data": {
    "course": { /* course object */ },
    "hasAccess": true,
    "progress": {
      "completedLessons": 5,
      "totalLessons": 20,
      "percentage": 25
    }
  }
}
```

### 📖 Module & Lesson Endpoints

#### GET /api/courses/:courseId/modules
**Descripción**: Listar módulos de un curso
**Response 200**:
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "64f7b8a9b12c3d4e5f6789ab",
        "title": "Introducción",
        "description": "Conceptos básicos",
        "order": 1,
        "lessonsCount": 5
      }
    ]
  }
}
```

#### GET /api/modules/:moduleId/lessons
**Descripción**: Listar lecciones de un módulo
**Response 200**:
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "64f7b8a9b12c3d4e5f6789ab",
        "title": "Variables y Tipos",
        "description": "Fundamentos de variables",
        "order": 1,
        "type": "video",
        "duration": 15,
        "isCompleted": false
      }
    ]
  }
}
```

### 💰 Purchase Endpoints

#### POST /api/courses/:courseId/purchase
**Headers**: `Authorization: Bearer <token>`
**Descripción**: Crear intención de compra
**Body**:
```json
{
  "paymentMethodId": "pm_1234567890"
}
```
**Response 200**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abc123",
    "purchaseId": "64f7b8a9b12c3d4e5f6789ab"
  }
}
```

#### GET /api/users/my-courses
**Headers**: `Authorization: Bearer <token>`
**Descripción**: Obtener cursos comprados por el usuario
**Response 200**:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "course": { /* course object */ },
        "purchaseDate": "2025-01-01T00:00:00.000Z",
        "progress": 45
      }
    ]
  }
}
```

### 🔒 Two-Factor Authentication

#### POST /api/advanced/2fa/generate
**Headers**: `Authorization: Bearer <token>`
**Descripción**: Generar secreto 2FA y QR code
**Response 200**:
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAA...",
    "backupCodes": ["12345678", "87654321"]
  }
}
```

#### POST /api/advanced/2fa/enable
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "token": "123456"
}
```
**Response 200**:
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

### 📊 Analytics Endpoints

#### POST /api/advanced/analytics/track
**Headers**: `Authorization: Bearer <token>`
**Descripción**: Registrar evento de analytics
**Body**:
```json
{
  "event": "course_started",
  "data": {
    "courseId": "64f7b8a9b12c3d4e5f6789ab",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/advanced/analytics/dashboard
**Headers**: `Authorization: Bearer <token>` (role: admin/teacher)
**Response 200**:
```json
{
  "success": true,
  "data": {
    "userMetrics": {
      "totalUsers": 1500,
      "newUsersThisMonth": 120,
      "activeUsers": 850
    },
    "courseMetrics": {
      "totalCourses": 45,
      "publishedCourses": 32,
      "averageRating": 4.6
    },
    "revenueMetrics": {
      "totalRevenue": 25000,
      "monthlyRevenue": 3500,
      "averageOrderValue": 89.99
    }
  }
}
```

### 🔔 Notification Endpoints

#### POST /api/advanced/notifications/send
**Headers**: `Authorization: Bearer <token>` (role: admin)
**Body**:
```json
{
  "type": "course_update",
  "title": "Nuevo contenido disponible",
  "message": "Se ha añadido una nueva lección",
  "recipientId": "64f7b8a9b12c3d4e5f6789ab"
}
```

### 📱 PWA Endpoints

#### GET /manifest.json
**Descripción**: Manifest de PWA dinámico
**Response 200**:
```json
{
  "name": "Parnassus Academy",
  "short_name": "Parnassus",
  "description": "Plataforma de aprendizaje online",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### GET /sw.js
**Descripción**: Service Worker para PWA
**Content-Type**: application/javascript

---

## 🛡️ SEGURIDAD Y MIDDLEWARE

### Rate Limiting
- **Auth endpoints**: 5 requests/15min
- **Payment endpoints**: 3 requests/15min
- **General API**: 100 requests/15min

### Middlewares de Seguridad
1. **Helmet**: Headers de seguridad HTTP
2. **CORS**: Control de origen cruzado
3. **XSS Protection**: Sanitización de entrada
4. **SQL Injection Protection**: Sanitización NoSQL
5. **Rate Limiting**: Límites por IP y endpoint
6. **Timing Attack Protection**: Delays consistentes
7. **Malicious Request Detection**: Detección de patrones maliciosos

### Autenticación
- **JWT Tokens**: HS256 con expiración configurable
- **2FA**: TOTP con Google Authenticator compatible
- **Role-based Access**: student, teacher, admin
- **Password Security**: bcrypt con salt rounds configurables

---

## 📈 MONITORING Y LOGGING

### Métricas Disponibles
- Request/Response times
- Error rates por endpoint
- Cache hit/miss ratios
- Database query performance
- Memory y CPU usage

### Logging Estructurado
```json
{
  "level": "info",
  "time": "2025-01-14T22:32:21.756Z",
  "pid": 55216,
  "hostname": "localhost",
  "msg": "Request completed",
  "requestId": "req_123456789",
  "method": "GET",
  "url": "/api/courses",
  "statusCode": 200,
  "duration": 45,
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
```

### Health Check
#### GET /api/admin/health
**Response 200**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T22:32:21.756Z",
  "services": {
    "database": "connected",
    "cache": "active",
    "websockets": "running"
  },
  "metrics": {
    "uptime": 3600,
    "memoryUsage": 256,
    "activeConnections": 45
  }
}
```

---

## 🔧 CONFIGURACIÓN Y DEPLOYMENT

### Variables de Entorno
```bash
# Básicas
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Base de Datos
MONGODB_URI=mongodb://localhost:27017/parnassus

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics
MIXPANEL_TOKEN=your-mixpanel-token

# Cache
CACHE_TTL=300
```

### Scripts NPM
```bash
npm start          # Producción
npm run dev        # Desarrollo con nodemon
npm run seed       # Poblar base de datos
npm run health     # Check de salud
npm run metrics    # Ver métricas
npm run cache:clear # Limpiar cache
```

### Optimizaciones de Base de Datos
- Índices automáticos en campos críticos
- Query monitoring y optimization
- Connection pooling optimizado
- Agregaciones eficientes

---

## 🧪 TESTING

### Suite de Tests
```bash
node test-suite-complete.js  # Tests completos
node test-simple.cjs        # Tests básicos
```

### Cobertura de Tests
- ✅ Infraestructura básica
- ✅ Autenticación y autorización
- ✅ CRUD de cursos y contenido
- ✅ Sistema de compras
- ✅ Analytics y métricas
- ✅ Seguridad y rate limiting
- ✅ WebSockets y notificaciones
- ✅ PWA functionality

---

## 📚 CASOS DE USO PRINCIPALES

### Flujo de Estudiante
1. Registro/Login
2. Explorar catálogo de cursos
3. Comprar curso con Stripe
4. Acceder a contenido del curso
5. Marcar progreso por lección
6. Completar quizzes y evaluaciones
7. Obtener certificado de finalización

### Flujo de Instructor
1. Registro como teacher
2. Crear nuevo curso
3. Añadir módulos y lecciones
4. Subir contenido (videos, textos, quizzes)
5. Someter a revisión
6. Publicar curso aprobado
7. Monitorear analytics y estudiantes

### Flujo de Administrador
1. Gestionar usuarios y roles
2. Revisar y aprobar cursos
3. Monitorear métricas del sistema
4. Gestionar reembolsos
5. Configurar notificaciones globales
6. Acceder a analytics completos

---

## 🚀 CARACTERÍSTICAS AVANZADAS

### WebSockets (Socket.IO)
- Notificaciones en tiempo real
- Updates de progreso instantáneos
- Chat en vivo (futuro)
- Sincronización multi-dispositivo

### Progressive Web App
- Instalación en dispositivos móviles
- Funcionamiento offline básico
- Cache inteligente de recursos
- Push notifications

### Analytics Avanzado
- Tracking de eventos personalizado
- Métricas de engagement
- Análisis de conversión
- Reportes automatizados

### Sistema de Cache
- Cache en memoria para consultas frecuentes
- Invalidación inteligente
- Cache de rutas por TTL
- Estadísticas de rendimiento

---

## 🔄 ACTUALIZACIONES Y MANTENIMIENTO

### Versionado
- Semantic Versioning (semver)
- Changelog automático
- Backward compatibility
- Migration scripts

### Backup y Recovery
- Backup automático de MongoDB
- Punto de restauración
- Disaster recovery plan
- Data retention policies

### Performance Optimization
- Query optimization continuo
- Index management automático
- Memory profiling
- Load testing regular

---

**Documentación actualizada**: 14 de Agosto 2025
**Versión API**: v3.0.0
**Estado**: Producción Ready ✅
