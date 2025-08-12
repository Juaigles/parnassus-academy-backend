import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
