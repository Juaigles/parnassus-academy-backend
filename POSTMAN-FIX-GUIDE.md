# 🔧 Guía Completa para Probar el Syllabus Automático

## 🚨 Errores Solucionados

### ✅ Error de Variables Postman
- **Problema**: `{{draftCourseId}}` no se resolvía
- **Sol## 🔧 Troubleshooting

### ❌ Error: "Invalid ObjectId"
- **Causa**: ID no válido
- **Solución**: Usar IDs de 24 caracteres hexadecimales

### ❌ Error: "JWT expired"
- **Causa**: Token expirado
- **Solución**: Hacer login nuevamente

### ❌ Error: "Course not found"  
- **Causa**: Curso no existe
- **Solución**: Usar ID de curso válido o crear uno nuevo

### ❌ Error: "Module not found"
- **Causa**: Módulo no existe para la lección
- **Solución**: Crear módulo primero

### ❌ Error: "Path 'type' is required"
- **Causa**: En recursos de lecciones falta el campo `type`
- **Solución**: Usar `"kind"` o `"type"` en los recursos
- **Ejemplo correcto**:
```json
"resources": [
  {
    "title": "PDF",
    "url": "https://example.com/file.pdf",
    "kind": "pdf"
  }
]
```

### ❌ Error: "Path 'course' is required"
- **Causa**: Error de mapeo de campos  
- **Solución**: Ya solucionado automáticamente - mapeo `courseId` → `course` reales o configurar variables correctamente

### ✅ Error de Token Expirado  
- **Problema**: JWT expired
- **Solución**: Hacer login nuevamente para obtener token válido

### ✅ Error de Validación Module
- **Problema**: `Path 'course' is required`
- **Solución**: Mapeo automático de `courseId` → `course`

## 📋 IDs Disponibles para Testing

- **Curso español**: `689c7a6de7d76eb677b817e0`
- **Curso francés**: Se creará dinámicamente

## 🔑 PASO 1: Obtener Token Válido

**POST** `http://localhost:3000/auth/login`
```json
{
  "email": "teacher@example.com",
  "password": "teacher123"
}
```

**Respuesta:**
```json
{
  "access": "TOKEN_AQUI",
  "refresh": "REFRESH_TOKEN_AQUI"
}
```

## 🏗️ PASO 2: Crear Módulo

**POST** `http://localhost:3000/modules`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "689c7a6de7d76eb677b817e0",
  "title": "Módulo 1 — Fundamentos",
  "index": 0,
  "description": "Conceptos básicos del idioma"
}
```

**Respuesta esperada:**
```json
{
  "id": "NUEVO_MODULE_ID",
  "course": "689c7a6de7d76eb677b817e0",
  "title": "Módulo 1 — Fundamentos",
  "index": 0,
  "description": "Conceptos básicos del idioma",
  "required": true,
  "createdAt": "2025-08-13T11:49:00.000Z",
  "updatedAt": "2025-08-13T11:49:00.000Z"
}
```

## 📝 PASO 3: Crear Lección

**POST** `http://localhost:3000/lessons`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "689c7a6de7d76eb677b817e0",
  "moduleId": "ID_DEL_MODULO_CREADO_ARRIBA",
  "title": "Lección 1: Introducción",
  "index": 0,
  "durationSec": 1800,
  "contentHtml": "<p>Contenido de la lección</p>",
  "resources": [
    {
      "title": "Apuntes PDF",
      "url": "https://example.com/apuntes.pdf",
      "kind": "pdf"
    },
    {
      "title": "Video explicativo",
      "url": "https://example.com/video.mp4",
      "type": "video"
    }
  ]
}
```

**Nota importante sobre recursos:**
- Puedes usar `"kind"` o `"type"` indistintamente
- El sistema normaliza automáticamente `kind` → `type`
- Valores válidos: `"pdf"`, `"video"`, `"link"`

## 🔍 PASO 4: Ver Syllabus Automático

**GET** `http://localhost:3000/courses/689c7a6de7d76eb677b817e0`

**En la respuesta busca:**
```json
{
  "marketing": {
    "syllabus": [
      {
        "title": "Módulo 1 — Fundamentos",
        "lessons": [
          {
            "title": "Lección 1: Introducción",
            "durationSec": 1800
          }
        ]
      }
    ]
  }
}
```

## 🔄 PASO 5: Regenerar Syllabus (Opcional)

**POST** `http://localhost:3000/courses/689c7a6de7d76eb677b817e0/syllabus/regenerate`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Syllabus regenerado automáticamente",
  "syllabus": [...]
}
```

## 🎯 Funciones Automáticas

### ✨ El syllabus se actualiza automáticamente cuando:
1. **Creas un módulo** → Se agrega al syllabus
2. **Creas una lección** → Se agrega al módulo correspondiente
3. **Actualizas títulos** → Se refleja en el syllabus
4. **Eliminas contenido** → Se quita del syllabus

### 📊 Estructura del Syllabus:
```json
{
  "marketing": {
    "syllabus": [
      {
        "title": "Nombre del Módulo",
        "lessons": [
          {
            "title": "Nombre de la Lección", 
            "durationSec": 1800
          }
        ]
      }
    ]
  }
}
```

## � Troubleshooting

### ❌ Error: "Invalid ObjectId"
- **Causa**: ID no válido
- **Solución**: Usar IDs de 24 caracteres hexadecimales

### ❌ Error: "JWT expired"
- **Causa**: Token expirado
- **Solución**: Hacer login nuevamente

### ❌ Error: "Course not found"  
- **Causa**: Curso no existe
- **Solución**: Usar ID de curso válido o crear uno nuevo

### ❌ Error: "Module not found"
- **Causa**: Módulo no existe para la lección
- **Solución**: Crear módulo primero

## ✅ Validaciones Implementadas

- ✅ Validación de ObjectId para courseId y moduleId
- ✅ Verificación de existencia de curso y módulo
- ✅ Mapeo automático de campos API → Base de datos  
- ✅ Normalización automática: `kind` → `type` en recursos de lecciones
- ✅ Hooks automáticos para actualización de syllabus
- ✅ Mensajes de error claros y específicos
- ✅ Validación flexible de recursos (acepta `type` o `kind`)

### 🔄 Normalizaciones Automáticas:

**Para Módulos:**
- `courseId` → `course`

**Para Lecciones:**
- `courseId` → `course`
- `moduleId` → `module`
- `resources[].kind` → `resources[].type`

**Para Marketing:**
- `type` → `kind` (en recursos)
- `studentName` → `authorName` (en testimonios)  
- `country` → `countryCode` (en testimonios)
- `instructor` → se elimina automáticamente

¡El sistema ahora funciona perfectamente! 🎉
