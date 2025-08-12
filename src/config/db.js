import mongoose from 'mongoose';
import { logger } from '../libs/logger.js';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI, { autoIndex: true, maxPoolSize: 10 });
  logger.info('Mongo connected');
}
