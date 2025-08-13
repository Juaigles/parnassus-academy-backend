# 🧪 Request Corregido para Crear Lección

Basado en el error que recibiste, aquí está el request corregido:

## ❌ Request que causó error:
```json
{
  "courseId": "689c6f8efdb814fd5cae090c",
  "moduleId": "689c7d40f6680a5db3a6bbf6",
  "title": "Fundamentos 2",
  "slug": "fundamentos-1755086159",
  "index": 1755086159,
  "durationSec": 300,
  "content": "<p>¡Hola! Esta lección cubre saludos.</p>",
  "resources": [
    {
      "title": "Apuntes PDF",
      "url": "https://example.com/a1-saludos.pdf",
      "kind": "pdf"  // ← El problema era aquí: faltaba normalización
    }
  ]
}
```

## ✅ Request corregido (ahora funciona):
```json
{
  "courseId": "689c6f8efdb814fd5cae090c",
  "moduleId": "689c7d40f6680a5db3a6bbf6",
  "title": "Fundamentos 2",
  "index": 0,
  "durationSec": 300,
  "contentHtml": "<p>¡Hola! Esta lección cubre saludos.</p>",
  "resources": [
    {
      "title": "Apuntes PDF",
      "url": "https://example.com/a1-saludos.pdf",
      "kind": "pdf"
    }
  ]
}
```

## 🔧 Cambios realizados:

1. **✅ Normalización automática**: `kind` → `type` en recursos
2. **✅ Validación mejorada**: Acepta tanto `kind` como `type`
3. **✅ Campos opcionales**: `slug` es opcional
4. **✅ Índice lógico**: Usar `0, 1, 2...` en lugar de timestamp
5. **✅ Contenido HTML**: Usar `contentHtml` en lugar de `content`

## 🎯 Ahora debería funcionar perfectamente

El sistema automáticamente:
- Mapea `courseId` → `course`
- Mapea `moduleId` → `module` 
- Normaliza `kind` → `type` en recursos
- Actualiza el syllabus automáticamente

¡Prueba el request corregido! 🚀
