// src/utils/databaseOptimization.js
import mongoose from 'mongoose';
import { logger } from '../libs/logger.js';

/**
 * Configuración optimizada de MongoDB
 */
export const optimizeMongooseConnection = () => {
  // Configuraciones de performance (solo opciones válidas)
  mongoose.set('bufferCommands', false);
  
  // Optimizar queries
  mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
  
  // Pool de conexiones optimizado
  const connectionOptions = {
    maxPoolSize: 10, // Máximo 10 conexiones
    serverSelectionTimeoutMS: 5000, // 5 segundos timeout
    socketTimeoutMS: 45000, // 45 segundos socket timeout
    family: 4, // Usar IPv4
    
    // Optimizaciones adicionales
    maxIdleTimeMS: 30000, // Cerrar conexiones idle después de 30s
    minPoolSize: 2, // Mantener al menos 2 conexiones
    
    // Heartbeat
    heartbeatFrequencyMS: 10000, // Check cada 10s
    
    // Compression
    compressors: ['zlib'],
    zlibCompressionLevel: 6
  };
  
  return connectionOptions;
};

/**
 * Clase para analizar performance de queries
 */
class QueryAnalyzer {
  constructor() {
    this.slowQueries = [];
    this.queryStats = new Map();
  }
  
  analyzeQuery(operation, collection, duration, explain = null) {
    const key = `${operation}:${collection}`;
    
    // Actualizar estadísticas
    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        slowQueries: 0
      });
    }
    
    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, duration);
    
    // Query lenta (>100ms)
    if (duration > 100) {
      stats.slowQueries++;
      
      this.slowQueries.push({
        operation,
        collection,
        duration,
        timestamp: new Date(),
        explain
      });
      
      // Mantener solo las últimas 100 queries lentas
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-50);
      }
      
      logger.warn({
        operation,
        collection,
        duration,
        explain
      }, 'Slow query detected');
    }
    
    this.queryStats.set(key, stats);
  }
  
  getStats() {
    const stats = {};
    
    for (const [key, data] of this.queryStats.entries()) {
      stats[key] = {
        ...data,
        slowQueryRate: data.count > 0 ? (data.slowQueries / data.count * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    return {
      queryStats: stats,
      recentSlowQueries: this.slowQueries.slice(-10),
      totalSlowQueries: this.slowQueries.length
    };
  }
  
  clearStats() {
    this.queryStats.clear();
    this.slowQueries = [];
  }
}

const queryAnalyzer = new QueryAnalyzer();

/**
 * Middleware para monitorear queries de Mongoose
 */
export const setupQueryMonitoring = () => {
  // Hook para todos los queries
  mongoose.plugin(function(schema) {
    schema.pre(/^find/, function() {
      this._startTime = Date.now();
    });
    
    schema.post(/^find/, function() {
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        const operation = this.op || 'find';
        const collection = this.model?.collection?.name || 'unknown';
        
        queryAnalyzer.analyzeQuery(operation, collection, duration);
      }
    });
    
    // Para agregaciones
    schema.pre('aggregate', function() {
      this._startTime = Date.now();
    });
    
    schema.post('aggregate', function() {
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        queryAnalyzer.analyzeQuery('aggregate', this.model?.collection?.name || 'unknown', duration);
      }
    });
  });
};

/**
 * Funciones helper para queries optimizadas
 */
export const optimizedQueries = {
  /**
   * Buscar curso con datos relacionados optimizado
   */
  async findCourseWithDetails(courseId, userId = null) {
    const pipeline = [
      { $match: { _id: mongoose.Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'instructor',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, profilePicture: 1, bio: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: 'courseId',
          as: 'modules',
          pipeline: [
            { $sort: { index: 1 } },
            { $project: { title: 1, index: 1 } }
          ]
        }
      }
    ];
    
    // Si hay usuario, agregar datos de progreso
    if (userId) {
      pipeline.push({
        $lookup: {
          from: 'progresses',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $and: [{ $expr: { $eq: ['$courseId', '$$courseId'] } }, { userId: mongoose.Types.ObjectId(userId) }] } }
          ],
          as: 'progress'
        }
      });
    }
    
    const Course = mongoose.model('Course');
    return Course.aggregate(pipeline);
  },
  
  /**
   * Listar cursos con filtros optimizado
   */
  async findCoursesOptimized(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const matchStage = { status: 'published' };
    
    if (filters.level) matchStage.level = filters.level;
    if (filters.tags?.length) matchStage.tags = { $in: filters.tags };
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      matchStage['pricing.amountCents'] = {};
      if (filters.priceMin !== undefined) matchStage['pricing.amountCents'].$gte = filters.priceMin;
      if (filters.priceMax !== undefined) matchStage['pricing.amountCents'].$lte = filters.priceMax;
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'instructor',
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }]
        }
      },
      {
        $addFields: {
          instructor: { $arrayElemAt: ['$instructor', 0] }
        }
      },
      { $sort: { 'stats.averageRating': -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          title: 1,
          excerpt: 1,
          level: 1,
          pricing: 1,
          'marketing.card.coverImageUrl': 1,
          'stats.averageRating': 1,
          'stats.totalReviews': 1,
          'stats.totalStudents': 1,
          instructor: 1,
          slug: 1
        }
      }
    ];
    
    const Course = mongoose.model('Course');
    return Course.aggregate(pipeline);
  },
  
  /**
   * Estadísticas de instructor optimizadas
   */
  async getInstructorStats(instructorId) {
    const pipeline = [
      { $match: { owner: mongoose.Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          publishedCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          totalStudents: { $sum: '$stats.totalStudents' },
          totalRevenue: { $sum: '$stats.totalRevenue' },
          avgRating: { $avg: '$stats.averageRating' }
        }
      }
    ];
    
    const Course = mongoose.model('Course');
    return Course.aggregate(pipeline);
  }
};

/**
 * Crear índices optimizados
 */
export const createOptimizedIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Índices para Course
    await db.collection('courses').createIndex({ status: 1, 'stats.averageRating': -1 });
    await db.collection('courses').createIndex({ tags: 1, level: 1 });
    await db.collection('courses').createIndex({ owner: 1, status: 1 });
    await db.collection('courses').createIndex({ slug: 1 }, { unique: true });
    
    // Índices para Purchase
    await db.collection('purchases').createIndex({ userId: 1, status: 1 });
    await db.collection('purchases').createIndex({ courseId: 1, status: 1 });
    await db.collection('purchases').createIndex({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
    
    // Índices para Review
    await db.collection('reviews').createIndex({ course: 1, status: 1 });
    await db.collection('reviews').createIndex({ user: 1, course: 1 }, { unique: true });
    
    // Índices para Progress
    await db.collection('progresses').createIndex({ userId: 1, courseId: 1 }, { unique: true });
    
    // Índices para Notification
    await db.collection('notifications').createIndex({ recipient: 1, read: 1, createdAt: -1 });
    
    logger.info('Optimized indexes created successfully');
  } catch (error) {
    logger.error({ error }, 'Error creating optimized indexes');
  }
};

/**
 * Análisis de performance de la base de datos
 */
export const analyzeDatabasePerformance = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Obtener stats de las colecciones principales
    const collections = ['courses', 'users', 'purchases', 'reviews', 'progresses'];
    const stats = {};
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const collStats = await collection.stats();
      
      stats[collectionName] = {
        count: collStats.count,
        size: collStats.size,
        avgObjSize: collStats.avgObjSize,
        storageSize: collStats.storageSize,
        indexes: collStats.nindexes,
        totalIndexSize: collStats.totalIndexSize
      };
    }
    
    return {
      collections: stats,
      queryAnalyzer: queryAnalyzer.getStats(),
      connection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }
    };
  } catch (error) {
    logger.error({ error }, 'Error analyzing database performance');
    throw error;
  }
};

export { queryAnalyzer };
