import crypto from 'crypto';
import * as certificateRepo from '../repositories/certificateRepo.js';
import { getSignedVideoUrl } from '../libs/storage/s3.js'; // reutilizamos mock firma para ejemplo

function generateSerial({ userId, courseId }) {
  const salt = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${String(courseId).slice(-6)}-${String(userId).slice(-6)}-${salt}`;
}

export async function issueIfNotExists({ userId, courseId }) {
  let cert = await certificateRepo.findByUserCourse(userId, courseId);
  if (cert) return cert;
  cert = await certificateRepo.create({
    userId, courseId, serial: generateSerial({ userId, courseId })
  });
  return cert;
}

export const verifyBySerial = (serial) => certificateRepo.findBySerial(serial);
export const listMyCertificates = (userId) => certificateRepo.listByUser(userId);

// Simula URL firmada de descarga del PDF
export function getSignedPdfUrl(cert) {
  const key = cert.pdfKey || `certificates/${cert.serial}.pdf`;
  return getSignedVideoUrl(key);
}
