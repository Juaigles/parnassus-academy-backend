import mongoose from 'mongoose';

/**
 * Un vídeo por lección (1:1).
 * Guardamos la clave de almacenamiento (S3/R2/GCS), duración y transcripción.
 */
const videoAssetSchema = new mongoose.Schema({
  courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lessonId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true, index: true },
  storageKey:{ type: String, required: true, trim: true },
  durationSec:{ type: Number, default: 0, min: 0 },
  mimeType:  { type: String, default: 'video/mp4' },
  transcripts:[{ type: String }]
}, { timestamps: true, versionKey: false });

export default mongoose.model('VideoAsset', videoAssetSchema);
