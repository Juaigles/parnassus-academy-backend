import { ZodError } from 'zod';
import { logger } from '../libs/logger.js';

export function notFound(_req, res){ res.status(404).json({ error: 'Not Found' }); }

export function errorHandler(err, req, res, _next){
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues });
  if (err && (err.code === 11000 || err.codeName === 'DuplicateKey')) {
    return res.status(409).json({ error: 'Duplicate key', details: err.keyValue || {} });
  }
  const status = err.status || 500;
  const msg = err.publicMessage || 'Internal Server Error';
  if (status >= 500) logger.error({ err, path: req.url }, 'Unhandled error');
  res.status(status).json({ error: msg });
}
