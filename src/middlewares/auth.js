import { verifyAccess } from '../libs/jwt.js';

export function optionalAuth(req, _res, next){
  try{
    const h = req.headers?.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (t){ const d = verifyAccess(t); req.user = { id: d.sub, roles: d.roles || [] }; }
  }catch{}
  next();
}

export function requireAuth(req, res, next){
  try{
    const h = req.headers?.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!t) return res.status(401).json({ error: 'Missing token' });
    const d = verifyAccess(t);
    req.user = { id: d.sub, roles: d.roles || [] };
    next();
  }catch{ return res.status(401).json({ error: 'Invalid token' }); }
}

export function requireRole(role){
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
