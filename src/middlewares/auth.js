// src/middlewares/auth.js
import { verifyAccess } from '../libs/jwt.js';
import { logger } from '../libs/logger.js';

export function requireAuth(req, res, next) {
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = verifyAccess(token);
    req.user = { id: decoded.sub, roles: decoded.roles || [] };
    next();
  } catch (err) {
    logger.warn({ err }, 'JWT verify failed');
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = verifyAccess(token);
      req.user = { id: decoded.sub, roles: decoded.roles || [] };
    } catch {}
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });
    const has = req.user.roles?.some(r => roles.includes(r));
    if (!has) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
