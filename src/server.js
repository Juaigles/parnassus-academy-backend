import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import mongoSanitize from 'mongo-sanitize';

import { env } from './config/env.js';
import { logger } from './libs/logger.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';

async function main() {
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN || true, credentials: true }));
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Sanitización anti NoSQL injection
  app.use((req, _res, next) => {
    if (req.body) req.body = mongoSanitize(req.body);
    if (req.query) req.query = mongoSanitize(req.query);
    next();
  });

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/auth', limiter, authRouter);

  app.use('/', healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal startup error');
  process.exit(1);
});
