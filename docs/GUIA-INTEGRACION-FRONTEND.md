# 🔗 GUÍA DE INTEGRACIÓN FRONTEND
# PARNASSUS ACADEMY API - Frontend Integration Guide

## 🚀 Configuración Inicial

### Base URL y Headers
```javascript
const API_BASE = 'http://localhost:3001/api'; // Development
const API_BASE = 'https://api.parnassus-academy.com/api'; // Production

// Headers requeridos
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Para requests autenticados
const authHeaders = {
  ...defaultHeaders,
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

### Configuración de Axios (Recomendado)
```javascript
// utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para token automático
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 AUTENTICACIÓN

### Registro de Usuario
```javascript
// services/authService.js
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    
    // Guardar token automáticamente
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user, token };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error de registro' 
    };
  }
};
```

### Login de Usuario
```javascript
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { user, token, requires2FA } = response.data.data;
    
    if (requires2FA) {
      return { success: true, requires2FA: true, user };
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user, token };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error de login' 
    };
  }
};
```

### Verificación de Autenticación
```javascript
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return { success: true, user: response.data.data.user };
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: false, error: 'Usuario no autenticado' };
  }
};
```

### Vue.js Composable para Auth
```javascript
// composables/useAuth.js
import { ref, computed, onMounted } from 'vue';
import { registerUser, loginUser, getCurrentUser } from '@/services/authService';

export const useAuth = () => {
  const user = ref(null);
  const loading = ref(false);
  const isAuthenticated = computed(() => !!user.value);
  const isTeacher = computed(() => user.value?.role === 'teacher');
  const isAdmin = computed(() => user.value?.role === 'admin');

  const register = async (userData) => {
    loading.value = true;
    const result = await registerUser(userData);
    if (result.success) {
      user.value = result.user;
    }
    loading.value = false;
    return result;
  };

  const login = async (credentials) => {
    loading.value = true;
    const result = await loginUser(credentials);
    if (result.success && !result.requires2FA) {
      user.value = result.user;
    }
    loading.value = false;
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    user.value = null;
    window.location.href = '/';
  };

  const checkAuth = async () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      user.value = JSON.parse(savedUser);
      // Verificar con el servidor
      const result = await getCurrentUser();
      if (!result.success) {
        logout();
      } else {
        user.value = result.user;
      }
    }
  };

  onMounted(() => {
    checkAuth();
  });

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    isTeacher,
    isAdmin,
    register,
    login,
    logout,
    checkAuth
  };
};
```

---

## 📚 GESTIÓN DE CURSOS

### Listar Cursos
```javascript
// services/courseService.js
export const getCourses = async (params = {}) => {
  try {
    const response = await api.get('/courses', { params });
    return {
      success: true,
      courses: response.data.data.courses,
      pagination: response.data.data.pagination
    };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};

// Uso en componente Vue
const { courses, loading, loadCourses } = useCourses();

const useCourses = () => {
  const courses = ref([]);
  const loading = ref(false);
  const pagination = ref({});

  const loadCourses = async (filters = {}) => {
    loading.value = true;
    const result = await getCourses(filters);
    if (result.success) {
      courses.value = result.courses;
      pagination.value = result.pagination;
    }
    loading.value = false;
    return result;
  };

  return { courses, loading, pagination, loadCourses };
};
```

### Obtener Curso Individual
```javascript
export const getCourse = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}`);
    return {
      success: true,
      course: response.data.data.course,
      hasAccess: response.data.data.hasAccess,
      progress: response.data.data.progress
    };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### Crear Curso (Solo Teachers)
```javascript
export const createCourse = async (courseData) => {
  try {
    const response = await api.post('/courses', courseData);
    return { success: true, course: response.data.data.course };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

---

## 🛒 SISTEMA DE COMPRAS

### Comprar Curso
```javascript
// services/purchaseService.js
export const purchaseCourse = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/purchase`);
    return {
      success: true,
      clientSecret: response.data.data.clientSecret,
      purchaseId: response.data.data.purchaseId
    };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};

// Integración con Stripe
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY);

const handlePurchase = async (courseId) => {
  const result = await purchaseCourse(courseId);
  
  if (result.success) {
    const { error } = await stripe.confirmCardPayment(result.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user.value.firstName + ' ' + user.value.lastName,
          email: user.value.email,
        },
      }
    });

    if (!error) {
      // Pago exitoso
      router.push('/my-courses');
    }
  }
};
```

### Obtener Mis Cursos
```javascript
export const getMyCourses = async () => {
  try {
    const response = await api.get('/users/my-courses');
    return { success: true, courses: response.data.data.courses };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

---

## 📖 CONTENIDO DE CURSOS

### Obtener Módulos del Curso
```javascript
export const getCourseModules = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}/modules`);
    return { success: true, modules: response.data.data.modules };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### Obtener Lecciones del Módulo
```javascript
export const getModuleLessons = async (moduleId) => {
  try {
    const response = await api.get(`/modules/${moduleId}/lessons`);
    return { success: true, lessons: response.data.data.lessons };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### Marcar Lección como Completada
```javascript
export const markLessonComplete = async (lessonId) => {
  try {
    await api.post(`/lessons/${lessonId}/complete`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

---

## 🔒 AUTENTICACIÓN 2FA

### Generar 2FA
```javascript
// services/twoFactorService.js
export const generate2FA = async () => {
  try {
    const response = await api.post('/advanced/2fa/generate');
    return {
      success: true,
      secret: response.data.data.secret,
      qrCode: response.data.data.qrCode,
      backupCodes: response.data.data.backupCodes
    };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### Activar 2FA
```javascript
export const enable2FA = async (token) => {
  try {
    await api.post('/advanced/2fa/enable', { token });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};

// Componente Vue para 2FA
<template>
  <div class="two-factor-setup">
    <div v-if="step === 1">
      <h3>Configurar Autenticación de Dos Factores</h3>
      <button @click="generateSecret">Generar Código QR</button>
    </div>
    
    <div v-if="step === 2">
      <img :src="qrCode" alt="QR Code" />
      <p>Escanea este código con Google Authenticator</p>
      
      <input 
        v-model="verificationCode" 
        placeholder="Código de verificación"
        maxlength="6"
      />
      <button @click="enableTwoFactor">Activar 2FA</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generate2FA, enable2FA } from '@/services/twoFactorService';

const step = ref(1);
const qrCode = ref('');
const verificationCode = ref('');

const generateSecret = async () => {
  const result = await generate2FA();
  if (result.success) {
    qrCode.value = result.qrCode;
    step.value = 2;
  }
};

const enableTwoFactor = async () => {
  const result = await enable2FA(verificationCode.value);
  if (result.success) {
    // Redirigir o mostrar éxito
  }
};
</script>
```

---

## 🔔 NOTIFICACIONES EN TIEMPO REAL

### Configurar Socket.IO
```javascript
// services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = new Map();
  }

  connect(token) {
    this.socket = io(process.env.VUE_APP_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  handleNotification(data) {
    const callbacks = this.callbacks.get('notification') || [];
    callbacks.forEach(callback => callback(data));
  }
}

export const socketService = new SocketService();

// Composable para notificaciones
export const useNotifications = () => {
  const notifications = ref([]);

  const initializeNotifications = () => {
    socketService.on('notification', (notification) => {
      notifications.value.unshift(notification);
      
      // Mostrar toast notification
      showToast(notification.title, notification.message);
    });
  };

  const showToast = (title, message) => {
    // Implementar con tu librería de toast preferida
    // toast.success(`${title}: ${message}`);
  };

  return { notifications, initializeNotifications };
};
```

---

## 📊 ANALYTICS Y TRACKING

### Enviar Eventos de Analytics
```javascript
// services/analyticsService.js
export const trackEvent = async (event, data = {}) => {
  try {
    await api.post('/advanced/analytics/track', {
      event,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

// Composable para analytics
export const useAnalytics = () => {
  const trackCourseView = (courseId) => {
    trackEvent('course_viewed', { courseId });
  };

  const trackLessonStart = (lessonId, courseId) => {
    trackEvent('lesson_started', { lessonId, courseId });
  };

  const trackLessonComplete = (lessonId, courseId) => {
    trackEvent('lesson_completed', { lessonId, courseId });
  };

  const trackPurchaseIntent = (courseId) => {
    trackEvent('purchase_intent', { courseId });
  };

  return {
    trackCourseView,
    trackLessonStart,
    trackLessonComplete,
    trackPurchaseIntent
  };
};
```

---

## 🔍 BÚSQUEDA

### Buscar Cursos
```javascript
// services/searchService.js
export const searchCourses = async (query, filters = {}) => {
  try {
    const params = {
      q: query,
      ...filters
    };
    
    const response = await api.get('/search/courses', { params });
    return {
      success: true,
      results: response.data.data.results,
      total: response.data.data.total
    };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};

// Composable para búsqueda
export const useSearch = () => {
  const results = ref([]);
  const loading = ref(false);
  const query = ref('');

  const search = async (searchQuery, filters = {}) => {
    loading.value = true;
    query.value = searchQuery;
    
    const result = await searchCourses(searchQuery, filters);
    if (result.success) {
      results.value = result.results;
    }
    
    loading.value = false;
    return result;
  };

  return { results, loading, query, search };
};
```

---

## 📱 PWA INTEGRATION

### Configurar PWA en Frontend
```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered: ', registration);
    })
    .catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
}

// Detectar si la app es instalable
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Mostrar botón de instalación personalizado
  showInstallButton();
});

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App installed');
    }
    deferredPrompt = null;
  }
};
```

---

## 🛡️ MANEJO DE ERRORES

### Error Handler Global
```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Error del servidor
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Datos inválidos';
      case 401:
        return 'No autorizado';
      case 403:
        return 'Acceso denegado';
      case 404:
        return 'Recurso no encontrado';
      case 429:
        return 'Demasiadas peticiones, intenta más tarde';
      case 500:
        return 'Error interno del servidor';
      default:
        return data?.message || 'Error desconocido';
    }
  } else if (error.request) {
    // Sin respuesta del servidor
    return 'Error de conexión';
  } else {
    // Error en la configuración
    return 'Error en la petición';
  }
};

// Plugin de Vue para manejo global de errores
export const errorPlugin = {
  install(app) {
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue Error:', err, info);
      // Enviar a servicio de logging
    };
    
    app.provide('handleError', handleApiError);
  }
};
```

---

## 🧪 TESTING DE INTEGRACIÓN

### Tests con Vitest y Vue Test Utils
```javascript
// tests/services/authService.test.js
import { describe, it, expect, vi } from 'vitest';
import { registerUser, loginUser } from '@/services/authService';
import api from '@/utils/api';

vi.mock('@/utils/api');

describe('AuthService', () => {
  it('should register user successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          user: { id: '1', email: 'test@test.com' },
          token: 'mock-token'
        }
      }
    };
    
    api.post.mockResolvedValue(mockResponse);
    
    const result = await registerUser({
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@test.com');
  });
});
```

---

## 📋 CHECKLIST DE INTEGRACIÓN

### ✅ Configuración Inicial
- [ ] Configurar axios con interceptors
- [ ] Configurar variables de entorno
- [ ] Implementar manejo de tokens
- [ ] Configurar CORS en desarrollo

### ✅ Autenticación
- [ ] Implementar registro/login
- [ ] Configurar guards de ruta
- [ ] Implementar logout
- [ ] Configurar 2FA

### ✅ Gestión de Estado
- [ ] Configurar Pinia/Vuex stores
- [ ] Implementar persistencia de estado
- [ ] Configurar composables

### ✅ UI/UX
- [ ] Implementar loading states
- [ ] Configurar notificaciones toast
- [ ] Implementar manejo de errores
- [ ] Configurar componentes de formulario

### ✅ Funcionalidades Avanzadas
- [ ] Integrar WebSockets
- [ ] Configurar PWA
- [ ] Implementar analytics tracking
- [ ] Configurar Stripe

### ✅ Testing
- [ ] Tests unitarios de servicios
- [ ] Tests de integración
- [ ] Tests E2E críticos

---

**Guía actualizada**: 14 de Agosto 2025
**Compatible con**: Vue 3, React 18+, Angular 15+
**Versión API**: v3.0.0
