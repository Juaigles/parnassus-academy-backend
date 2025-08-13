# Scripts útiles para Parnassus Academy API

## Comandos de desarrollo

### Iniciar servidor
```bash
npm run dev
```

### Ejecutar tests básicos
```bash
node test-api.js
```

### Ver logs del servidor
```bash
# Los logs aparecen automáticamente en la consola durante npm run dev
```

## Comandos de base de datos

### Conectar a MongoDB (si está local)
```bash
mongosh
use parnassus_academy
```

### Ver colecciones
```javascript
show collections
```

### Limpiar datos de prueba
```javascript
db.users.deleteMany({email: {$regex: /@test\.com$/}})
db.courses.deleteMany({title: /prueba|test/i})
```

## cURL Examples - Endpoints principales

### 1. Registro de usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "Profesor Ejemplo",
    "role": "teacher"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

### 3. Crear curso (necesita token)
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Mi Curso de Ejemplo",
    "description": "Un curso increíble",
    "category": "technology",
    "level": "beginner",
    "language": "es"
  }'
```

### 4. Obtener curso público
```bash
curl -X GET http://localhost:3000/api/courses/public/COURSE_ID_HERE
```

### 5. Crear módulo
```bash
curl -X POST http://localhost:3000/api/courses/COURSE_ID/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Módulo 1: Introducción",
    "description": "Módulo introductorio",
    "isRequired": true
  }'
```

### 6. Crear lección
```bash
curl -X POST http://localhost:3000/api/courses/COURSE_ID/modules/MODULE_ID/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Lección 1: Fundamentos",
    "description": "Primera lección",
    "content": "Contenido de la lección...",
    "isRequired": true
  }'
```

### 7. Ver outline del curso
```bash
curl -X GET http://localhost:3000/api/courses/COURSE_ID/outline \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Marcar lección completada
```bash
curl -X POST http://localhost:3000/api/progress/lessons/LESSON_ID/complete \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -d '{}'
```

### 9. Ver progreso
```bash
curl -X GET http://localhost:3000/api/progress/courses/COURSE_ID \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE"
```

### 10. Actualizar marketing del curso
```bash
curl -X PATCH http://localhost:3000/api/courses/COURSE_ID/marketing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_TOKEN_HERE" \
  -d '{
    "pricing": {
      "price": 99.99,
      "currency": "USD",
      "discountPrice": 79.99
    },
    "seo": {
      "metaTitle": "Mi Curso Increíble",
      "metaDescription": "Aprende todo sobre...",
      "keywords": ["programación", "desarrollo", "curso"]
    }
  }'
```

## Herramientas recomendadas

### Postman Collection
Importar estos endpoints en Postman para testing más fácil:
- Base URL: `http://localhost:3000/api`
- Variables: `{{baseUrl}}`, `{{teacherToken}}`, `{{studentToken}}`

### MongoDB Compass
- Connection string: `mongodb://localhost:27017/parnassus_academy`
- Para visualizar datos de forma gráfica

### VS Code Extensions útiles
- REST Client: Para probar endpoints directamente en VS Code
- MongoDB for VS Code: Para visualizar la base de datos
- Postman: Para testing de API

## Estructura de respuestas

### Respuesta exitosa
```json
{
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Respuesta con error
```json
{
  "error": "Descripción del error",
  "details": [
    {
      "field": "email",
      "message": "Email es requerido",
      "code": "required"
    }
  ]
}
```

## Variables de entorno importantes

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/parnassus_academy
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
NODE_ENV=development
```

## Estados del servidor

### ✅ Servidor funcionando correctamente
```
[INFO] Mongo connected
[INFO] API listening on http://localhost:3000 [development]
```

### ❌ Error de puerto ocupado
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución**: Cambiar puerto en .env o cerrar proceso existente

### ❌ Error de conexión a MongoDB
```
[ERROR] MongoDB connection failed
```
**Solución**: Verificar que MongoDB esté ejecutándose
