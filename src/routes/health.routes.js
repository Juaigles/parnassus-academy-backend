import { Router } from 'express';
export const healthRouter = Router();
healthRouter.get('/', (_req, res)=> res.json({ ok: true }));
healthRouter.get('/health', (_req, res)=> res.json({ status: 'ok' }));
