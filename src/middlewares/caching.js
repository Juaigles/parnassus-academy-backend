// src/middlewares/caching.js
import { logger } from '../libs/logger.js';

class MemoryCache {
  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 min default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.hits = 0;
    this.misses = 0;
    
    // Limpiar cache expirado cada 5 minutos
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }
  
  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      // Eliminar el más antiguo (LRU simple)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
      created: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return item.value;
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug({ cleaned, remaining: this.cache.size }, 'Cache cleanup completed');
    }
  }
  
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  
  // Invalidar cache por patrones
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    logger.debug({ pattern, invalidated }, 'Cache invalidated by pattern');
    return invalidated;
  }
}

// Cache global
const cache = new MemoryCache();

/**
 * Middleware de caching para responses
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300000, // 5 minutos
    keyGenerator = (req) => `${req.method}:${req.originalUrl}:${req.user?.id || 'anon'}`,
    skipCache = () => false,
    skipMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  } = options;
  
  return (req, res, next) => {
    // Saltar cache para ciertos métodos
    if (skipMethods.includes(req.method)) {
      return next();
    }
    
    // Saltar cache si la función lo dice
    if (skipCache(req)) {
      return next();
    }
    
    const cacheKey = keyGenerator(req);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      logger.debug({ cacheKey }, 'Cache hit');
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // Interceptar respuesta para cachear
    const originalSend = res.send;
    res.send = function(data) {
      // Solo cachear respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const parsedData = JSON.parse(data);
          cache.set(cacheKey, parsedData, ttl);
          logger.debug({ cacheKey, ttl }, 'Response cached');
        } catch (e) {
          // No es JSON válido, no cachear
        }
      }
      
      res.set('X-Cache', 'MISS');
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Cache específico para cursos públicos
 */
export const courseCacheMiddleware = cacheMiddleware({
  ttl: 600000, // 10 minutos
  keyGenerator: (req) => `course:${req.params.courseId || req.params.slug}:${req.user?.id || 'public'}`,
  skipCache: (req) => {
    // No cachear si el usuario es owner del curso
    return req.user?.roles?.includes('teacher') || req.user?.roles?.includes('admin');
  }
});

/**
 * Cache para listas de cursos
 */
export const courseListCacheMiddleware = cacheMiddleware({
  ttl: 300000, // 5 minutos
  keyGenerator: (req) => {
    const query = new URLSearchParams(req.query).toString();
    return `courses:list:${query}`;
  }
});

/**
 * Cache para búsquedas
 */
export const searchCacheMiddleware = cacheMiddleware({
  ttl: 900000, // 15 minutos
  keyGenerator: (req) => {
    const query = new URLSearchParams(req.query).toString();
    return `search:${query}`;
  }
});

/**
 * Middleware para invalidar cache cuando se actualizan datos
 */
export const invalidateCacheMiddleware = (patterns = []) => {
  return (req, res, next) => {
    // Ejecutar después de la respuesta
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cache.invalidatePattern(pattern);
        });
      }
    });
    
    next();
  };
};

/**
 * Middleware específico para invalidar cache de cursos
 */
export const invalidateCourseCacheMiddleware = invalidateCacheMiddleware([
  'course:.*',
  'courses:list:.*',
  'search:.*'
]);

/**
 * Endpoint para stats de cache
 */
export const getCacheStats = (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
};

/**
 * Endpoint para limpiar cache
 */
export const clearCache = (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
};

/**
 * Middleware de compresión condicional
 */
export const smartCompressionMiddleware = (req, res, next) => {
  // Comprimir solo respuestas grandes
  const originalSend = res.send;
  
  res.send = function(data) {
    const size = Buffer.byteLength(data || '', 'utf8');
    
    // Solo comprimir si es mayor a 1KB
    if (size > 1024) {
      res.set('X-Uncompressed-Size', size.toString());
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

export { cache };
