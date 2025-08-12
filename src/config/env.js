import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  CORS_ORIGIN: z.string().optional(),
  MONGO_URI: z.string().min(10),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  LOG_LEVEL: z.string().default('info'),
  PINO_PRETTY: z.string().optional(),
  PROGRESS_VIDEO_THRESHOLD: z.string().optional(),
  CERT_HASH_SECRET: z.string().min(5),
  SIGNED_URL_TTL_SEC: z.coerce.number().default(3600)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten());
  process.exit(1);
}
export const env = parsed.data;
