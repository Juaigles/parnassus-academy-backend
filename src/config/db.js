// src/config/db.js
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../libs/logger.js';
import { optimizeMongooseConnection } from '../utils/databaseOptimization.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  
  // Configuración optimizada
  const connectionOptions = optimizeMongooseConnection();
  
  try {
    await mongoose.connect(env.MONGO_URI, connectionOptions);
    
    logger.info({
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      readyState: mongoose.connection.readyState
    }, 'MongoDB connected with optimized configuration');
    
    // Event listeners para monitoreo
    mongoose.connection.on('error', (err) => {
      logger.error({ error: err }, 'MongoDB connection error');
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.fatal({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
}
