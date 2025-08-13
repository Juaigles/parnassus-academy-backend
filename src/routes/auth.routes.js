// src/routes/auth.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { register, login, me, refresh, logout } from '../controllers/authController.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', requireAuth, logout);
