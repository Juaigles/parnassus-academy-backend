import * as courseRepo from '../repositories/courseRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as videoAssetRepo from '../repositories/videoAssetRepo.js';
import { getSignedVideoUrl } from '../libs/storage/s3.js';
import { assertCanEditCourse, assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { isLessonUnlocked } from './gatingService.js';
import AppError from '../libs/appError.js';

/** Crea o reemplaza el vídeo de una lección. */
export async function upsertVideoAsset({ data, user }) {
  const lesson = await lessonRepo.findById(data.lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  if (String(lesson.course) !== String(data.courseId)) {
    throw new AppError('Conflict', 409, 'lesson.course no coincide con courseId');
  }
  const course = await courseRepo.findById(data.courseId);
  assertCanEditCourse(course, user);

  const va = await videoAssetRepo.upsertByLesson(lesson._id, {
    lessonId: lesson._id,
    owner: user.id,  // Agregar el owner del video
    key: data.storageKey,  // El campo en el modelo se llama 'key', no 'storageKey'
    durationSec: data.durationSec ?? 0,
    mimeType: data.mimeType || 'video/mp4',
    transcripts: data.transcripts || [],
    scope: 'lesson'  // Establecer scope explícitamente
  });

  // actualiza duración de la lección si aporta valor
  if ((data.durationSec ?? 0) > 0) {
    await lessonRepo.updateById(lesson._id, { durationSec: data.durationSec });
  }

  return va;
}

/** Devuelve una URL firmada temporal para reproducir el vídeo de una lección. */
export async function getLessonVideoUrl({ lessonId, viewer }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.course);
  assertCanViewCourse(course, viewer || null);

  // Si no es admin ni owner, aplica gating (bloqueos)
  if (!isAdmin(viewer) && !isOwner(viewer, course)) {
    const unlocked = await isLessonUnlocked({
      user: viewer, course, module: { _id: lesson.module, index: 0 }, lesson
    });
    if (!unlocked) throw new AppError('Locked', 423, 'Lección bloqueada por prerrequisitos');
  }

  const va = await videoAssetRepo.findByLesson(lessonId);
  if (!va) throw new AppError('Not found', 404, 'La lección no tiene vídeo');

  const url = getSignedVideoUrl(va.storageKey);
  return { url, mimeType: va.mimeType, durationSec: va.durationSec, expiresInSec: 3600 };
}

/** Elimina el vídeo de una lección. */
export async function deleteLessonVideo({ lessonId, user }) {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  const course = await courseRepo.findById(lesson.courseId);
  assertCanEditCourse(course, user);

  await videoAssetRepo.deleteByLesson(lessonId);
  // Opcional: resetear duración si quieres
  // await lessonRepo.updateById(lessonId, { durationSec: 0 });
  return { ok: true };
}
