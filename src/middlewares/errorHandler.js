// src/middlewares/errorHandler.js
import { logger } from '../libs/logger.js';

export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  logger.error({ err }, 'Unhandled error');
  res.status(err.status || 500).json({ error: err.publicMessage || 'Server error' });
}
