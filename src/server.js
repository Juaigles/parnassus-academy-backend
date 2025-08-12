import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import mongoSanitize from "mongo-sanitize";

import { env } from "./config/env.js";
import { logger } from "./libs/logger.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { courseRouter } from "./routes/course.routes.js";
import { moduleRouter } from "./routes/module.routes.js";
import { lessonRouter } from "./routes/lesson.routes.js";
import { videoRouter } from "./routes/video.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { quizRouter } from './routes/quiz.routes.js';
import { moduleQuizRouter } from './routes/moduleQuiz.routes.js';
import { courseExtrasRouter } from './routes/courseExtras.routes.js';
import { progressRouter } from './routes/progress.routes.js';
import { outlineRouter } from './routes/outline.routes.js';
import { videoAssetRouter } from './routes/videoAsset.routes.js';

async function main() {
  await connectDB();

  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN || true, credentials: true }));
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Sanitización anti NoSQL injection
  app.use((req, _res, next) => {
    if (req.body) req.body = mongoSanitize(req.body);
    if (req.query) req.query = mongoSanitize(req.query);
    next();
  });

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use("/auth", limiter, authRouter);
  app.use(courseRouter);
  app.use(moduleRouter);
  app.use(lessonRouter);
  app.use(videoRouter);
  app.use(adminRouter);
  app.use(quizRouter);
app.use(moduleQuizRouter);
app.use(courseExtrasRouter);
app.use(progressRouter);
app.use(outlineRouter);
app.use(videoAssetRouter);

  app.use("/", healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    logger.info(
      `API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
