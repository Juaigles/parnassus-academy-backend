// src/middlewares/security.js
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss';

// Rate limiters específicos por endpoint
export const createRateLimiters = () => ({
  // Auth endpoints - más restrictivo
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por IP
    message: { error: 'Too many auth attempts, try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // API general
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Upload/Write operations - más restrictivo
  write: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // 20 operaciones de escritura
    message: { error: 'Too many write operations' },
  }),
  
  // Payments - muy restrictivo
  payment: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 intentos de pago por hora
    message: { error: 'Too many payment attempts' },
  }),
});

// XSS Protection middleware
export const xssProtection = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? xss(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Headers de seguridad mejorados
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Middleware de validación de Content-Type
export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({ 
          error: 'Unsupported Media Type',
          expected: allowedTypes 
        });
      }
    }
    
    next();
  };
};

// Middleware anti-timing attack para login
export const timingAttackProtection = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const minTime = 100; // 100ms mínimo
    
    if (elapsed < minTime) {
      setTimeout(() => {}, minTime - elapsed);
    }
  });
  
  next();
};
