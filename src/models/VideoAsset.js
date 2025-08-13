import mongoose from 'mongoose';

const videoAssetSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  key: { type: String, required: true },      // s3 key o ruta
  durationSec: { type: Number, default: 0 },

  scope: { type: String, enum: ['lesson','course_preview','resource'], default: 'lesson' },
  visibility: { type: String, enum: ['public','private'], default: 'private' },

  playbackUrl: { type: String },              // si ya guardas una URL pública
}, { timestamps: true, versionKey: false });

export default mongoose.model('VideoAsset', videoAssetSchema);
