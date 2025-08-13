// src/middlewares/errorHandler.js
import { ZodError } from 'zod';
import AppError from '../libs/appError.js';
import { logger } from '../libs/logger.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  // Log detallado
  logger.error({ err, url: req.url, body: req.body }, 'Unhandled error');

  // 1) Zod → 400 con detalles
  if (err instanceof ZodError) {
    const issues = err.issues?.map(i => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code
    })) ?? [];
    return res.status(400).json({ error: 'validation_error', issues });
  }

  // 2) AppError → status controlado
  if (err instanceof AppError) {
    return res.status(err.status || 400).json({ error: err.message || 'app_error' });
  }

  // 3) Mongo duplicate key → 409 con info
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'duplicate';
    return res.status(409).json({ error: `duplicate_${field}`, key: err.keyValue });
  }

  // 4) Por defecto → 500
  return res.status(500).json({ error: 'internal_server_error' });
}
