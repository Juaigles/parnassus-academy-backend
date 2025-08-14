// src/config/env.js
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().url().or(z.string().regex(/^mongodb/)),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  CERT_HASH_SECRET: z.string().min(16).optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  
  // Email (para notificaciones de compra)
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_PROVIDER: z.enum(['ses', 'smtp', 'sendgrid']).default('smtp').optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // === NUEVAS CONFIGURACIONES DE MEJORAS ===
  
  // Cache
  CACHE_TTL: z.coerce.number().default(300000), // 5 minutos
  CACHE_MAX_SIZE: z.coerce.number().default(1000),
  
  // Seguridad
  XSS_PROTECTION: z.coerce.boolean().default(true),
  MALICIOUS_REQUEST_DETECTION: z.coerce.boolean().default(true),
  TIMING_ATTACK_PROTECTION: z.coerce.boolean().default(true),
  
  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_API_MAX: z.coerce.number().default(100),
  RATE_LIMIT_PAYMENT_MAX: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutos
  
  // Monitoring
  HEALTH_CHECK_ALERTS: z.coerce.boolean().default(true),
  SLOW_QUERY_THRESHOLD: z.coerce.number().default(100),
  METRICS_RETENTION_HOURS: z.coerce.number().default(24),
  
  // Database Optimization
  DB_ENABLE_QUERY_MONITORING: z.coerce.boolean().default(true),
  DB_AUTO_CREATE_INDEXES: z.coerce.boolean().default(true),
  DB_CONNECTION_POOL_SIZE: z.coerce.number().default(10),
  
  // Logging
  STRUCTURED_LOGGING: z.coerce.boolean().default(true),
  AUDIT_LOGGING: z.coerce.boolean().default(true),
  BUSINESS_EVENT_LOGGING: z.coerce.boolean().default(true),
  LOG_SANITIZATION: z.coerce.boolean().default(true),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid .env:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
