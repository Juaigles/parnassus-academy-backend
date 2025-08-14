import 'dotenv/config';
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import mongoSanitize from "mongo-sanitize";
import compression from "compression";
import { createServer } from 'http';

import { env } from "./config/env.js";
import { logger } from "./libs/logger.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

// Nuevos middlewares de mejora
import { 
  createRateLimiters, 
  xssProtection, 
  securityHeaders, 
  validateContentType,
  timingAttackProtection 
} from "./middlewares/security.js";
import { 
  enhancedValidate, 
  requestContext, 
  requestLogger, 
  maliciousRequestDetection 
} from "./middlewares/enhancedValidation.js";
import { 
  metricsMiddleware, 
  errorMetricsMiddleware,
  getMetrics,
  getHealthCheck
} from "./middlewares/monitoring.js";
import { 
  cacheMiddleware, 
  courseCacheMiddleware, 
  courseListCacheMiddleware,
  searchCacheMiddleware,
  invalidateCourseCacheMiddleware,
  getCacheStats,
  clearCache
} from "./middlewares/caching.js";
import { 
  setupQueryMonitoring, 
  createOptimizedIndexes,
  optimizeMongooseConnection 
} from "./utils/databaseOptimization.js";
import { 
  enhancedLogger,
  structuredLoggingMiddleware,
  auditMiddleware 
} from "./libs/enhancedLogger.js";

import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { courseRouter } from "./routes/course.routes.js";
import { moduleRouter } from "./routes/module.routes.js";
import { lessonRouter } from "./routes/lesson.routes.js";
import { videoRouter } from "./routes/video.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { quizRouter } from './routes/quiz.routes.js';
import { moduleQuizRouter } from './routes/moduleQuiz.routes.js';
import { courseExtrasRouter } from './routes/courseExtras.routes.js';
import { progressRouter } from './routes/progress.routes.js';
import { outlineRouter } from './routes/outline.routes.js';
import { videoAssetRouter } from './routes/videoAsset.routes.js';
import { purchaseRouter } from './routes/purchase.routes.js';
import { wishlistRouter } from './routes/wishlist.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { enhancedAdminRouter } from './routes/enhanced-admin.routes.js';
import advancedFeaturesRouter from './routes/advanced-features.routes.js';

// Servicios avanzados
import { realTimeNotifications } from './services/notificationService.js';
import { pwaService } from './services/pwaService.js';

async function main() {
  // Configurar optimizaciones de base de datos
  setupQueryMonitoring();
  
  // Conectar a la base de datos con configuración optimizada
  await connectDB();
  
  // Crear índices optimizados (solo en desarrollo o primera vez)
  if (env.NODE_ENV === 'development') {
    await createOptimizedIndexes();
  }

  const app = express();
  app.set("trust proxy", 1);

  // Rate limiters configurados
  const rateLimiters = createRateLimiters();

  // === MIDDLEWARES DE SEGURIDAD ===
  app.use(securityHeaders); // Headers de seguridad mejorados
  app.use(cors({ origin: env.CORS_ORIGIN || true, credentials: true }));
  app.use(validateContentType()); // Validar Content-Type
  app.use(compression()); // Compresión GZIP
  
  // === MIDDLEWARES DE LOGGING Y CONTEXTO ===
  app.use(requestContext); // Agregar contexto al request
  app.use(structuredLoggingMiddleware); // Logging estructurado
  app.use(metricsMiddleware); // Métricas de performance
  
  // === WEBHOOKS (ANTES de JSON parsing) ===
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRouter);

  // === PARSING DE BODY ===
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // === SANITIZACIÓN Y SEGURIDAD ===
  app.use(xssProtection); // Protección XSS
  app.use(maliciousRequestDetection); // Detección de requests maliciosos
  
  // Sanitización anti NoSQL injection
  app.use((req, _res, next) => {
    if (req.body) req.body = mongoSanitize(req.body);
    if (req.query) req.query = mongoSanitize(req.query);
    next();
  });

  // === AUDITORÍA ===
  app.use(auditMiddleware); // Auditoría de cambios importantes

  // === ENDPOINTS DE ADMINISTRACIÓN ===
  app.use('/api/admin', enhancedAdminRouter);

  // === RATE LIMITING POR TIPO ===
  app.use('/api/auth', rateLimiters.auth);
  app.use('/api/purchases', rateLimiters.payment);
  app.use('/api', rateLimiters.api);

  // === RUTAS CON CACHE ===
  // Rutas públicas con cache
  app.use('/api/courses', courseListCacheMiddleware);
  app.use('/api/search', searchCacheMiddleware);
  
  // === RUTAS PRINCIPALES ===
  app.use('/api/auth', timingAttackProtection, authRouter);
  app.use('/api', courseRouter);
  app.use('/api', moduleRouter);
  app.use('/api', lessonRouter);
  app.use('/api', videoRouter);
  app.use('/api', adminRouter);
  app.use('/api', quizRouter);
  app.use('/api', moduleQuizRouter);
  app.use('/api', courseExtrasRouter);
  app.use('/api', progressRouter);
  app.use('/api', outlineRouter);
  app.use('/api', videoAssetRouter);
  
  // Rutas con invalidación de cache
  app.use('/api', invalidateCourseCacheMiddleware, purchaseRouter);
  app.use('/api', invalidateCourseCacheMiddleware, wishlistRouter);
  app.use('/api', invalidateCourseCacheMiddleware, reviewRouter);
  
  app.use('/api', searchRouter);
  app.use('/api', analyticsRouter);
  app.use('/api', notificationRouter);
  
  // === NUEVAS FUNCIONALIDADES AVANZADAS ===
  app.use('/api/advanced', advancedFeaturesRouter);
  
  // === PWA SUPPORT ===
  app.use(pwaService.servePWAFiles());
  app.use(pwaService.configurePWAHeaders());

  // === HEALTH CHECK ===
  app.use('/', healthRouter);

  // === ERROR HANDLING ===
  app.use(errorMetricsMiddleware); // Métricas de errores
  app.use(notFound);
  app.use(errorHandler);

  // === CREAR SERVIDOR HTTP ===
  const server = createServer(app);
  
  // === INICIALIZAR WEBSOCKETS ===
  realTimeNotifications.initializeSocketIO(server);

  // === INICIAR SERVIDOR ===
  server.listen(env.PORT, () => {
    enhancedLogger.info({
      port: env.PORT,
      environment: env.NODE_ENV,
      features: {
        caching: true,
        monitoring: true,
        security: true,
        rateLimiting: true,
        auditLogging: true,
        realTimeNotifications: true,
        twoFactorAuth: true,
        pwaSupport: true,
        advancedAnalytics: true
      }
    }, `🚀 Enhanced API with Advanced Features listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    
    // Log de inicio de negocio
    enhancedLogger.businessEvent('server_started', {
      environment: env.NODE_ENV,
      port: env.PORT,
      timestamp: new Date().toISOString()
    });
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
