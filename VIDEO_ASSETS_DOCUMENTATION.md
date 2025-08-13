# Sistema de Video Assets - Documentación

## ✅ PROBLEMAS CORREGIDOS

### 🔧 Problema 1: storageKey no se guardaba

**Causa**: El modelo `VideoAsset` usa el campo `key`, pero el servicio estaba enviando `storageKey`.

**Solución**:
```javascript
// ANTES (incorrecto):
storageKey: data.storageKey

// DESPUÉS (correcto):
key: data.storageKey
```

### 🔧 Problema 2: Campos faltantes en el modelo

**Causa**: El modelo no incluía campos que se estaban enviando (`mimeType`, `transcripts`).

**Solución**: Actualizado el modelo `VideoAsset.js`:
```javascript
const videoAssetSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  key: { type: String, required: true },      // Clave de almacenamiento (S3, etc.)
  durationSec: { type: Number, default: 0 },
  mimeType: { type: String, default: 'video/mp4' },  // ✅ AGREGADO
  transcripts: { type: [String], default: [] },      // ✅ AGREGADO
  scope: { type: String, enum: ['lesson','course_preview','resource'], default: 'lesson' },
  visibility: { type: String, enum: ['public','private'], default: 'private' },
  playbackUrl: { type: String },
}, { timestamps: true, versionKey: false });
```

### 🔧 Problema 3: Referencias incorrectas a campos del modelo Lesson

**Causa**: Se usaba `lesson.courseId` y `lesson.moduleId` cuando los campos correctos son `lesson.course` y `lesson.module`.

**Solución**: Corregidas todas las referencias en `videoAssetService.js`.

## 📖 QUÉ SIGNIFICA "SCOPE LESSON"

### 🎯 Concepto de Scope

El campo `scope` define el **contexto de uso** del video asset. Puede tener tres valores:

```javascript
scope: { 
  type: String, 
  enum: ['lesson', 'course_preview', 'resource'], 
  default: 'lesson' 
}
```

### 📋 Tipos de Scope:

1. **`lesson`** - Video principal de una lección
   - Es el video educativo principal que los estudiantes deben ver
   - Se integra con el sistema de progreso de videos (90% para completar)
   - Se usa para desbloquear la siguiente lección
   - Solo puede haber uno por lección

2. **`course_preview`** - Video de vista previa del curso
   - Video promocional o introductorio del curso completo
   - Visible antes de matricularse
   - No cuenta para el progreso del curso
   - Usado para marketing

3. **`resource`** - Video como recurso adicional
   - Videos suplementarios o material de apoyo
   - No obligatorios para completar la lección
   - No bloquean el progreso

### 🔄 En el Sistema de Progreso:

**Solo los videos con `scope: 'lesson'`** se integran con:
- ✅ Sistema de progreso de 90% para completar
- ✅ Desbloqueo de siguientes lecciones  
- ✅ Integración con quizzes para completado total
- ✅ Gating y control de acceso

## 🚀 ENDPOINT ACTUALIZADO

### POST `/video-assets`

**Request Body**:
```json
{
  "lessonId": "689c85723b4a9ac81c15b775",
  "courseId": "689c8342445dd47640670389", 
  "storageKey": "videos/a1/saludos3.mp4",
  "durationSec": 300,
  "mimeType": "video/mp4",
  "transcripts": [
    "Hola...",
    "Bienvenidos..."
  ]
}
```

**Lo que se guarda en la base de datos**:
```javascript
{
  lessonId: ObjectId("689c85723b4a9ac81c15b775"),
  owner: ObjectId("689b177ef25bfe1516d17b0c"), // Usuario que subió el video
  key: "videos/a1/saludos3.mp4",              // ✅ AHORA SE GUARDA
  durationSec: 300,
  mimeType: "video/mp4",
  transcripts: ["Hola...", "Bienvenidos..."],
  scope: "lesson",                             // ✅ AUTOMÁTICO
  visibility: "private",                       // ✅ POR DEFECTO
  createdAt: "2025-08-13T13:02:11.804Z",
  updatedAt: "2025-08-13T13:02:11.804Z"
}
```

## 🔗 INTEGRACIÓN COMPLETA

### Con Sistema de Progreso de Videos:
- Videos con `scope: 'lesson'` requieren 90% de visualización
- Se registra progreso en tiempo real
- Desbloquea automáticamente la siguiente lección

### Con Sistema de Gating:
- Solo usuarios con acceso al curso pueden ver videos
- Videos bloqueados por prerrequisitos no son accesibles
- Gating se aplica automáticamente

### Con Sistema de Quiz:
- Completar lección = video al 90% + quiz aprobado
- Videos y quizzes trabajan en conjunto para el progreso

## ✅ ESTADO ACTUAL

**🟢 FUNCIONANDO CORRECTAMENTE:**
- ✅ storageKey se guarda como `key` en la base de datos
- ✅ Todos los campos se almacenan correctamente
- ✅ scope: 'lesson' se establece automáticamente
- ✅ Videos se integran con sistema de progreso
- ✅ Endpoint responde con status 201 (éxito)
- ✅ Servidor funcionando sin errores

**🎯 LISTO PARA USAR:**
El endpoint `/video-assets` ahora funciona completamente y guarda todos los datos correctamente en la base de datos.
