import { env } from '../../config/env.js';
import crypto from 'crypto';

/** Simula una URL firmada temporal (reemplaza con SDK real de S3/R2/GCS en prod). */
export function getSignedVideoUrl(storageKey, expiresInSec = 3600){
  const exp = Math.floor(Date.now()/1000) + expiresInSec;
  const sig = crypto.createHash('sha256').update(storageKey+':'+exp).digest('hex').slice(0,32);
  return `https://cdn.example.com/${encodeURIComponent(storageKey)}?exp=${exp}&sig=${sig}`;
}
