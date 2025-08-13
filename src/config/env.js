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
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid .env:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
