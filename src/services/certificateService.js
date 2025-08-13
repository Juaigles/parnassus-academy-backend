import crypto from 'crypto';
import { env } from '../config/env.js';
import * as certificateRepo from '../repositories/certificateRepo.js';
import AppError from '../libs/appError.js';

function generateCertificateCode({ userId, courseId }) {
  const timestamp = Date.now().toString(36);
  const userHash = String(userId).slice(-4);
  const courseHash = String(courseId).slice(-4);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CERT-${courseHash}-${userHash}-${timestamp}-${random}`;
}

function generateCertificateHash({ userId, courseId, code }) {
  const secret = env.CERT_HASH_SECRET || 'default_cert_secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}-${courseId}-${code}`)
    .digest('hex');
}

export async function issueCertificate({ userId, courseId }) {
  // Verificar si ya existe un certificado
  const existing = await certificateRepo.findByUserCourse(userId, courseId);
  if (existing) return existing;

  // Generar código y hash únicos
  const code = generateCertificateCode({ userId, courseId });
  const hash = generateCertificateHash({ userId, courseId, code });

  // Crear certificado
  const certificate = await certificateRepo.create({
    user: userId,
    course: courseId,
    code,
    hash,
    meta: { issuedBy: 'system' }
  });

  return certificate;
}

export async function getCertificateByUserCourse({ userId, courseId }) {
  const certificate = await certificateRepo.findByUserCourse(userId, courseId);
  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }
  return certificate;
}

export async function verifyCertificate({ code }) {
  const certificate = await certificateRepo.findByCode(code);
  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }
  return certificate;
}

export const listMyCertificates = (userId) => certificateRepo.listByUser(userId);
