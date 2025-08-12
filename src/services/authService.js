import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/userRepo.js';
import AppError from '../libs/appError.js';
import { signAccess, signRefresh, verifyRefresh } from '../libs/jwt.js';

export async function register({ email, password }){
  const exists = await userRepo.findByEmail(email.toLowerCase());
  if (exists) throw new AppError('Email already registered', 409, 'Email ya registrado');
  const hash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({ email: email.toLowerCase(), passwordHash: hash, roles: ['student'], emailVerified: false, status: 'active' });
  return { user: toPublic(user), ...issueTokens(user) };
}
export async function login({ email, password }){
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new AppError('Invalid credentials', 401, 'Credenciales inválidas');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid credentials', 401, 'Credenciales inválidas');
  return { user: toPublic(user), ...issueTokens(user) };
}
export async function refresh({ refresh }){
  if (!refresh) throw new AppError('Missing refresh', 400, 'Falta refresh token');
  const payload = verifyRefresh(refresh); // valida firma y exp
  // En producción: detectar reutilización (token theft) y revocar
  const user = await userRepo.findById(payload.sub);
  if (!user) throw new AppError('Not found', 404, 'Usuario no encontrado');
  return issueTokens(user);
}
export async function me(userId){
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError('Not found', 404, 'Usuario no encontrado');
  return { user: toPublic(user) };
}

function issueTokens(user){
  const payload = { sub: String(user._id), roles: user.roles || [] };
  return { access: signAccess(payload), refresh: signRefresh(payload) };
}
function toPublic(user){ return { id: String(user._id), email: user.email, roles: user.roles, emailVerified: user.emailVerified }; }
