# Flujo de Lógica de Negocio para Frontend - Parnassus Academy

## Resumen del Sistema

El sistema implementa un **flujo de aprendizaje progresivo** donde:
- ✅ Los estudiantes deben completar videos para desbloquear las siguientes lecciones
- ✅ Al completar todas las lecciones de un módulo, se desbloquea el quiz del módulo  
- ✅ Al aprobar el quiz del módulo, se desbloquea el siguiente módulo
- ✅ Al completar todos los módulos, se desbloquea el quiz final
- ✅ Al aprobar el quiz final, se emite el certificado y se marca el curso como completado

---

## 📋 Endpoints API Disponibles

### 🔐 Autenticación
```
POST /api/register          - Registro de usuario
POST /api/login             - Login
GET  /api/me               - Obtener datos del usuario actual
POST /api/refresh          - Refrescar token
POST /api/logout           - Logout
```

### 📚 Cursos
```
GET  /api/courses                    - Listar cursos públicos
GET  /api/courses/slug/:slug         - Obtener curso por slug
GET  /api/courses/:id               - Obtener curso por ID
GET  /api/courses/:courseId/modules  - Listar módulos del curso
```

### 📖 Módulos y Lecciones  
```
GET  /api/modules/:moduleId/lessons  - Listar lecciones del módulo
GET  /api/lessons/:id               - Obtener lección por ID
```

### 🎥 Videos
```
GET  /api/lessons/:lessonId/video-url - Obtener URL firmada del video
```

### 📊 Progreso
```
GET  /api/courses/:courseId/progress      - Obtener progreso del curso
GET  /api/lessons/:lessonId/progress      - Obtener progreso de lección
POST /api/lessons/:lessonId/progress/video - Registrar progreso de video
POST /api/lessons/:lessonId/complete      - Marcar lección como completada
```

### 🧪 Quiz de Módulo
```
GET  /api/modules/:moduleId/quiz          - Obtener quiz del módulo
POST /api/modules/:moduleId/quiz/attempts - Enviar intento de quiz
GET  /api/modules/:moduleId/quiz/attempts/my - Mis intentos del quiz
```

### 🏆 Quiz Final y Certificado
```
GET  /api/courses/:courseId/final-quiz        - Obtener quiz final
POST /api/courses/:courseId/final-quiz/start  - Iniciar quiz final
POST /api/courses/:courseId/final-quiz/submit - Enviar quiz final
GET  /api/courses/:courseId/certificate       - Obtener certificado
GET  /api/certificates/:serial/verify         - Verificar certificado
```

---

## 🔄 Flujo Completo del Frontend

### 1. 🛒 **COMPRA/INSCRIPCIÓN DEL CURSO**

> ⚠️ **NOTA**: Los endpoints de compra/pago no están implementados aún. 
> Por ahora, el acceso al curso se simula automáticamente al hacer la primera llamada de progreso.

**Implementación temporal:**
```javascript
// Al intentar acceder a un curso por primera vez, automáticamente se crea el progreso
const response = await fetch(`/api/courses/${courseId}/progress`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Implementación futura necesaria:**
```javascript
// Endpoints que necesitas implementar:
// POST /api/courses/:courseId/enroll - Inscribirse gratis
// POST /api/courses/:courseId/purchase - Comprar curso  
// POST /api/payments/process - Procesar pago
```

### 2. 🏠 **ACCEDER AL CURSO**

```javascript
// 1. Obtener datos del curso
const course = await fetch(`/api/courses/${courseId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Obtener módulos del curso
const modules = await fetch(`/api/courses/${courseId}/modules`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 3. Obtener progreso actual
const progress = await fetch(`/api/courses/${courseId}/progress`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 4. Determinar qué está desbloqueado
const unlockedContent = determineUnlockedContent(modules, progress);
```

### 3. 📖 **VER PRIMER MÓDULO Y PRIMERA LECCIÓN**

```javascript
// 1. Obtener lecciones del primer módulo
const firstModule = modules[0];
const lessons = await fetch(`/api/modules/${firstModule._id}/lessons`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Acceder a la primera lección (siempre desbloqueada)
const firstLesson = lessons.sort((a, b) => a.index - b.index)[0];
const lessonDetail = await fetch(`/api/lessons/${firstLesson._id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

### 4. 🎥 **VER VIDEO DE LA LECCIÓN**

```javascript
// 1. Obtener URL firmada del video
const videoData = await fetch(`/api/lessons/${lessonId}/video-url`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Configurar reproductor de video
const video = document.createElement('video');
video.src = videoData.signedUrl;

// 3. Registrar progreso del video cada 10 segundos
video.addEventListener('timeupdate', async () => {
  const progressPercent = (video.currentTime / video.duration) * 100;
  
  await fetch(`/api/lessons/${lessonId}/progress/video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      progressPercent: progressPercent,
      watchedSeconds: video.currentTime
    })
  });
});

// 4. Al completar 90% del video, marcar lección como completada
video.addEventListener('timeupdate', async () => {
  const progressPercent = (video.currentTime / video.duration) * 100;
  
  if (progressPercent >= 90) {
    await fetch(`/api/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Actualizar estado de la aplicación
    updateAppState();
  }
});
```

### 5. ➡️ **PASAR A LA SIGUIENTE LECCIÓN**

```javascript
// 1. Verificar qué lecciones están desbloqueadas después de completar la actual
const updatedProgress = await fetch(`/api/courses/${courseId}/progress`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Encontrar la siguiente lección
const currentLessonIndex = lessons.findIndex(l => l._id === currentLessonId);
const nextLesson = lessons[currentLessonIndex + 1];

// 3. Verificar si la siguiente lección está desbloqueada
const isNextLessonUnlocked = updatedProgress.lessons.find(
  lp => lp.lessonId === nextLesson?._id
)?.unlocked || false;

if (isNextLessonUnlocked) {
  // Navegar a la siguiente lección
  navigateToLesson(nextLesson._id);
} else {
  // Mostrar mensaje de que necesita completar la lección actual
  showMessage("Completa el video actual para desbloquear la siguiente lección");
}
```

### 6. 🧪 **COMPLETAR QUIZ DEL MÓDULO**

```javascript
// 1. Verificar si el quiz del módulo está disponible (todas las lecciones completadas)
const moduleProgress = updatedProgress.modules.find(m => m.moduleId === moduleId);
const canTakeQuiz = moduleProgress?.quizAvailable || false;

if (!canTakeQuiz) {
  showMessage("Completa todas las lecciones del módulo para acceder al quiz");
  return;
}

// 2. Obtener quiz del módulo
const moduleQuiz = await fetch(`/api/modules/${moduleId}/quiz`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 3. Presentar quiz al usuario y recoger respuestas
const userAnswers = presentQuizToUser(moduleQuiz.questions);

// 4. Enviar intento del quiz
const quizResult = await fetch(`/api/modules/${moduleId}/quiz/attempts`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    answers: userAnswers
  })
}).then(r => r.json());

// 5. Verificar si aprobó
if (quizResult.passed) {
  showMessage(`¡Felicidades! Aprobaste con ${quizResult.score}%`);
  // El siguiente módulo se desbloquea automáticamente
  updateAppState();
} else {
  showMessage(`No aprobaste. Obtuviste ${quizResult.score}%. Nota mínima: ${moduleQuiz.passingScore}%`);
}
```

### 7. 🔄 **REPETIR PARA TODOS LOS MÓDULOS**

```javascript
// Función para verificar el estado general del curso
async function checkCourseStatus(courseId) {
  const progress = await fetch(`/api/courses/${courseId}/progress`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  return {
    completedModules: progress.completedModules.length,
    totalModules: modules.length,
    canTakeFinalQuiz: progress.finalQuizAvailable || false,
    courseCompleted: progress.completed || false
  };
}

// Lógica de navegación entre módulos
async function navigateToNextModule(currentModuleId) {
  const courseStatus = await checkCourseStatus(courseId);
  
  if (courseStatus.canTakeFinalQuiz) {
    // Todos los módulos completados, mostrar quiz final
    showFinalQuizOption();
  } else {
    // Ir al siguiente módulo
    const nextModule = findNextUnlockedModule(currentModuleId);
    if (nextModule) {
      navigateToModule(nextModule._id);
    }
  }
}
```

### 8. 🏆 **QUIZ FINAL Y CERTIFICADO**

```javascript
// 1. Verificar disponibilidad del quiz final
const canTakeFinalQuiz = await checkCourseStatus(courseId).canTakeFinalQuiz;

if (!canTakeFinalQuiz) {
  showMessage("Completa todos los módulos para acceder al quiz final");
  return;
}

// 2. Iniciar quiz final
const quizSession = await fetch(`/api/courses/${courseId}/final-quiz/start`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 3. Obtener preguntas del quiz final
const finalQuiz = await fetch(`/api/courses/${courseId}/final-quiz`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 4. Presentar quiz y recoger respuestas
const finalAnswers = presentQuizToUser(finalQuiz.questions);

// 5. Enviar quiz final
const finalResult = await fetch(`/api/courses/${courseId}/final-quiz/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: quizSession.sessionId,
    answers: finalAnswers
  })
}).then(r => r.json());

// 6. Si aprobó, obtener certificado
if (finalResult.passed) {
  const certificate = await fetch(`/api/courses/${courseId}/certificate`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  showCertificate(certificate);
  markCourseAsCompleted();
} else {
  showMessage(`No aprobaste el quiz final. Obtuviste ${finalResult.score}%`);
}
```

---

## 🛠️ Funciones de Utilidad para el Frontend

### Estado de Desbloqueado
```javascript
function determineUnlockedContent(modules, progress) {
  return modules.map(module => {
    const moduleProgress = progress.modules.find(m => m.moduleId === module._id);
    
    return {
      ...module,
      isUnlocked: moduleProgress?.unlocked || module.index === 0,
      isCompleted: progress.completedModules.includes(module._id),
      quizAvailable: moduleProgress?.quizAvailable || false,
      lessons: module.lessons?.map(lesson => {
        const lessonProgress = progress.lessons.find(l => l.lessonId === lesson._id);
        return {
          ...lesson,
          isUnlocked: lessonProgress?.unlocked || lesson.index === 0,
          isCompleted: lessonProgress?.completed || false,
          videoProgress: lessonProgress?.video?.progressPercent || 0
        };
      })
    };
  });
}
```

### Gestión de Estado Global
```javascript
// Usando Context API o Redux
const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [courseData, setCourseData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  
  const updateProgress = async () => {
    const newProgress = await fetch(`/api/courses/${courseId}/progress`);
    setProgress(newProgress);
  };
  
  return (
    <CourseContext.Provider value={{
      courseData,
      progress,
      currentLesson,
      updateProgress
    }}>
      {children}
    </CourseContext.Provider>
  );
}
```

### Componente de Video
```javascript
function VideoPlayer({ lessonId, onComplete }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef();
  
  useEffect(() => {
    // Obtener URL del video
    fetch(`/api/lessons/${lessonId}/video-url`)
      .then(r => r.json())
      .then(data => setVideoUrl(data.signedUrl));
  }, [lessonId]);
  
  const handleTimeUpdate = useCallback(
    throttle(async () => {
      const video = videoRef.current;
      const progressPercent = (video.currentTime / video.duration) * 100;
      
      // Registrar progreso
      await fetch(`/api/lessons/${lessonId}/progress/video`, {
        method: 'POST',
        body: JSON.stringify({ progressPercent })
      });
      
      // Si completa 90%, marcar como completado
      if (progressPercent >= 90) {
        await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
        onComplete();
      }
    }, 10000), // Cada 10 segundos
    [lessonId, onComplete]
  );
  
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      onTimeUpdate={handleTimeUpdate}
      controls
    />
  );
}
```

---

## 🚧 Endpoints Faltantes por Implementar

Para un sistema completo de e-learning, necesitarás implementar:

### Sistema de Compras
```javascript
// POST /api/courses/:courseId/enroll - Inscripción gratuita
// POST /api/courses/:courseId/purchase - Compra de curso
// GET  /api/users/my-courses - Mis cursos comprados
// POST /api/payments/process - Procesar pago
// GET  /api/payments/history - Historial de pagos
```

### Sistema de Notificaciones
```javascript
// GET  /api/notifications - Obtener notificaciones
// POST /api/notifications/mark-read - Marcar como leídas
```

### Sistema de Favoritos/Wishlist
```javascript
// POST /api/users/wishlist/:courseId - Agregar a wishlist
// GET  /api/users/wishlist - Ver wishlist
```

---

## 🔐 Consideraciones de Seguridad

1. **Todas las llamadas requieren autenticación** excepto las públicas
2. **El gating se valida en el backend** - no confíes solo en el frontend
3. **Las URLs de video son firmadas** y expiran automáticamente
4. **Los tokens de autenticación deben renovarse** periódicamente
5. **Valida permisos** antes de mostrar contenido

---

## 📱 Consideraciones de UX

1. **Indicadores visuales claros** de progreso y contenido bloqueado
2. **Mensajes informativos** cuando el contenido no está disponible
3. **Guardado automático** del progreso del video
4. **Manejo de errores** de conexión y timeouts
5. **Estados de carga** durante las llamadas a la API
6. **Modo offline** para contenido ya descargado (opcional)

---

Este flujo asegura que el estudiante siga una progresión natural y controlada a través del curso, con validaciones tanto en frontend como backend para mantener la integridad del sistema de aprendizaje.
