// src/services/pwaService.js
import { logger } from '../libs/logger.js';
import path from 'path';

class PWAService {
  constructor() {
    this.manifestConfig = {
      name: "Parnassus Academy",
      short_name: "Parnassus",
      description: "Plataforma de aprendizaje online",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#4F46E5",
      orientation: "portrait-primary",
      icons: [
        {
          src: "/icons/icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-96x96.png", 
          sizes: "96x96",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-128x128.png",
          sizes: "128x128", 
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-152x152.png",
          sizes: "152x152",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-384x384.png",
          sizes: "384x384",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any"
        }
      ],
      categories: ["education", "productivity"],
      screenshots: [
        {
          src: "/screenshots/mobile1.png",
          sizes: "540x720",
          type: "image/png",
          form_factor: "narrow"
        },
        {
          src: "/screenshots/desktop1.png", 
          sizes: "1280x720",
          type: "image/png",
          form_factor: "wide"
        }
      ]
    };
  }

  /**
   * Generar manifest.json
   */
  generateManifest() {
    return this.manifestConfig;
  }

  /**
   * Generar Service Worker
   */
  generateServiceWorker() {
    return `
const CACHE_NAME = 'parnassus-academy-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/offline.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar cache si existe
        if (response) {
          return response;
        }
        
        // Sino, hacer fetch de la red
        return fetch(event.request).catch(() => {
          // Si falla la red, mostrar página offline
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver curso',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/action-close.png'  
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Parnassus Academy', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Cerrar notificación
    event.notification.close();
  } else {
    // Click en la notificación principal
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  console.log('Sincronización en background ejecutada');
  // Aquí puedes sincronizar datos offline
}

// Actualizar Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
  }

  /**
   * Middleware para servir archivos PWA
   */
  servePWAFiles() {
    return (req, res, next) => {
      // Servir manifest.json
      if (req.path === '/manifest.json') {
        res.setHeader('Content-Type', 'application/json');
        return res.json(this.generateManifest());
      }

      // Servir service worker
      if (req.path === '/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        return res.send(this.generateServiceWorker());
      }

      // Servir página offline
      if (req.path === '/offline.html') {
        return res.send(this.generateOfflinePage());
      }

      next();
    };
  }

  /**
   * Generar página offline
   */
  generateOfflinePage() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sin conexión - Parnassus Academy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
        }
        .offline-container {
            max-width: 400px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .offline-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0 0 20px 0;
            font-size: 2rem;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.5;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .retry-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .retry-btn:hover {
            transform: translateY(-2px);
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .feature {
            margin: 10px 0;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📚</div>
        <h1>Sin conexión</h1>
        <p>No tienes conexión a internet en este momento. Algunas funciones están disponibles sin conexión.</p>
        
        <button class="retry-btn" onclick="window.location.reload()">
            Intentar de nuevo
        </button>
        
        <div class="features">
            <div class="feature">📖 Ver cursos descargados</div>
            <div class="feature">📝 Tomar notas offline</div>
            <div class="feature">⭐ Ver cursos favoritos</div>
        </div>
    </div>

    <script>
        // Auto-retry cuando vuelva la conexión
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>
`;
  }

  /**
   * Configurar headers PWA
   */
  configurePWAHeaders() {
    return (req, res, next) => {
      // Headers para permitir instalación
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Meta tags para PWA (para páginas HTML)
      if (req.accepts('html')) {
        res.locals.pwaMetaTags = `
          <meta name="theme-color" content="#4F46E5">
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="default">
          <meta name="apple-mobile-web-app-title" content="Parnassus">
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
          <link rel="manifest" href="/manifest.json">
        `;
      }

      next();
    };
  }

  /**
   * Estadísticas de uso PWA
   */
  getPWAStats() {
    // En una implementación real, esto vendría de analytics
    return {
      totalInstalls: 0, // Se tracking desde el frontend
      activeUsers: 0,
      offlineUsage: 0,
      pushNotificationSubscriptions: 0,
      timestamp: new Date()
    };
  }

  /**
   * Generar VAPID keys para push notifications
   */
  generateVAPIDKeys() {
    // En producción, estos se generarían una vez y se guardarían
    return {
      publicKey: 'temp_public_key_' + Date.now(),
      privateKey: 'temp_private_key_' + Date.now()
    };
  }

  /**
   * Log de eventos PWA
   */
  logPWAEvent(eventType, data = {}) {
    logger.info('PWA event', {
      type: 'pwa_event',
      eventType,
      data,
      timestamp: new Date()
    });
  }
}

export const pwaService = new PWAService();
