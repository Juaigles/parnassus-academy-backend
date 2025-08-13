# Funcionalidad Automática de Syllabus

## 🎯 ¿Qué hace?
La nueva funcionalidad genera automáticamente un **índice del curso (syllabus)** en la sección de marketing cada vez que:
- Se crea un nuevo módulo
- Se actualiza un módulo  
- Se elimina un módulo
- Se crea una nueva lección
- Se actualiza una lección
- Se elimina una lección

## 📋 Estructura del Syllabus
```json
{
  "marketing": {
    "syllabus": [
      {
        "title": "Introducción al Español",
        "lessons": [
          {
            "title": "Alfabeto y Pronunciación",
            "durationSec": 1800
          },
          {
            "title": "Saludos y Despedidas", 
            "durationSec": 1200
          }
        ]
      },
      {
        "title": "Gramática Básica",
        "lessons": [
          {
            "title": "Artículos y Género",
            "durationSec": 2100
          }
        ]
      }
    ]
  }
}
```

## 🚀 Cómo probarlo

### 1. Usar el curso de prueba creado
**ID del curso**: `689c7a6de7d76eb677b817e0`

### 2. Ver el syllabus actual
```bash
GET http://localhost:3000/courses/689c7a6de7d76eb677b817e0
```

### 3. Regenerar manualmente el syllabus (opcional)
```bash
POST http://localhost:3000/courses/689c7a6de7d76eb677b817e0/syllabus/regenerate
Authorization: Bearer TU_TOKEN_JWT
```

### 4. El syllabus aparece automáticamente en el marketing
Cuando hagas un PATCH al marketing, verás que el syllabus ya está incluido:

```bash
PATCH http://localhost:3000/courses/689c7a6de7d76eb677b817e0/marketing
Authorization: Bearer TU_TOKEN_JWT
Content-Type: application/json

{
  "card": {
    "subtitle": "Curso completo de español A1"
  }
}
```

**Respuesta incluirá el syllabus automáticamente:**
```json
{
  "marketing": {
    "card": {
      "subtitle": "Curso completo de español A1"
    },
    "syllabus": [
      // ... estructura automática generada
    ]
  }
}
```

## 🎯 Beneficios

1. **Automático**: No necesitas mantener manualmente el índice
2. **Consistente**: Siempre refleja el contenido real del curso
3. **Informativo**: Los usuarios ven exactamente qué van a aprender
4. **Duración**: Incluye la duración de cada lección para dar una idea del tiempo total

## 🔧 Funcionalidades adicionales

- **Hook automático**: Se actualiza al modificar módulos/lecciones
- **Endpoint manual**: Para regenerar cuando necesites
- **Validación**: Schema de validación incluido para el syllabus
- **Logging**: Mensajes de log para debugging

## 📝 Notas técnicas

- El syllabus se ordena por `index` de módulos y lecciones
- Solo muestra `title` y `durationSec` por seguridad (no expone contenido completo)
- Se almacena en `marketing.syllabus` como array de objetos
- Compatible con el sistema de validación existente
