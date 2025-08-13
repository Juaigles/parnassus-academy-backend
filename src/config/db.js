// src/config/db.js
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../libs/logger.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
  logger.info('Mongo connected');
}
