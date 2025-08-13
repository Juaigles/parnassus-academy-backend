// src/services/authService.js
import * as userRepo from '../repositories/userRepo.js';
import { signAccess, signRefresh, verifyRefresh } from '../libs/jwt.js';
import User from '../models/User.js';

export async function register({ email, password, roles = ['student'] }) {
  const exists = await userRepo.findByEmail(email);
  if (exists) throw new Error('Email already registered');

  const passwordHash = await User.hashPassword(password);
  const user = await userRepo.create({ email, passwordHash, roles, emailVerified: true });

  return issueTokens(user);
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  const ok = await user.comparePassword(password);
  if (!ok) throw new Error('Invalid credentials');
  return issueTokens(user);
}

export function issueTokens(user) {
  const payload = { sub: String(user._id), roles: user.roles };
  const access = signAccess(payload);
  const refresh = signRefresh({ sub: payload.sub });
  return { access, refresh, user: { id: payload.sub, email: user.email, roles: user.roles } };
}

export async function refreshTokens({ refresh }) {
  const decoded = verifyRefresh(refresh); // lanza si no es válido
  // 1) Asegurarnos de que el usuario existe y recuperar sus roles actuales
  const user = await userRepo.findById(decoded.sub);
  if (!user) throw new Error('user not found');

  const payload = { sub: String(user._id), roles: user.roles || [] };
  const access = signAccess(payload);
  const newRefresh = signRefresh({ sub: payload.sub }); // seguimos sin guardar roles en refresh
  return { access, refresh: newRefresh, user: { id: payload.sub, email: user.email, roles: user.roles } };
}