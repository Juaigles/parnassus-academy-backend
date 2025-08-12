import { registerSchema, loginSchema, refreshSchema } from '../validators/authSchemas.js';
import * as authService from '../services/authService.js';

export async function register(req,res,next){ try{ const dto=registerSchema.parse(req.body); const out=await authService.register(dto); res.status(201).json(out);}catch(e){next(e);} }
export async function login(req,res,next){ try{ const dto=loginSchema.parse(req.body); const out=await authService.login(dto); res.json(out);}catch(e){next(e);} }
export async function refresh(req,res,next){ try{ const dto=refreshSchema.parse(req.body); const out=await authService.refresh(dto); res.json(out);}catch(e){next(e);} }
export async function logout(_req,res,_next){ res.json({ ok:true }); }
export async function me(req,res,next){ try{ const out=await authService.me(req.user.id); res.json(out);}catch(e){next(e);} }
