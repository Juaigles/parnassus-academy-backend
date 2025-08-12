import pino from 'pino';
import { env } from '../config/env.js';
const isPretty = String(env.PINO_PRETTY || '').toLowerCase() === 'true';
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isPretty ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } : undefined
});
