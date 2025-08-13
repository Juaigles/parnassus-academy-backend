// src/controllers/authController.js
import * as authService from '../services/authService.js';

export async function register(req, res) {
  try {
    const { email, password, roles } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const out = await authService.register({ email, password, roles });
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'register failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const out = await authService.login({ email, password });
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: 'invalid credentials' });
  }
}

export async function me(req, res) {
  res.json({ id: req.user.id, roles: req.user.roles });
}
 export async function refresh(req, res) {
   try {
    const { refresh } = req.body || {};
    if (!refresh) return res.status(400).json({ error: 'refresh token required' });
    const token = req.body?.refresh ?? req.body?.refreshToken;
    if (!token) return res.status(400).json({ error: 'refresh token required' });
    const out = await authService.refreshTokens({ refresh: token });
     res.json(out);
   } catch {
     res.status(401).json({ error: 'invalid refresh' });
   }
 }


export function logout(_req, res) {
  // Stateless JWT: el "logout" se maneja cliente-side borrando tokens. (Opcional: blacklist server-side)
  res.json({ ok: true });
}
