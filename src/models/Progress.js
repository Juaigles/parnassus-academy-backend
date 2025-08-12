import mongoose from 'mongoose';

/**
 * Progreso sticky por usuario+lección.
 * - video.percentMax: máximo % visto (0..1), no baja.
 * - lessonCompleted: true cuando la lección cumple el umbral y (si hay quiz) aprobado.
 */
const progressSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },

  video: {
    percentMax:     { type: Number, default: 0, min: 0, max: 1 },
    lastPositionSec:{ type: Number, default: 0, min: 0 },
    secondsWatched: { type: Number, default: 0, min: 0 }
  },

  quiz: {
    attempts:  { type: Number, default: 0, min: 0 },
    bestScore: { type: Number, default: 0, min: 0, max: 100 },
    passed:    { type: Boolean, default: false }
  },

  lessonCompleted: { type: Boolean, default: false, index: true },
  completedAt:     { type: Date, default: null },

  startedAt:  { type: Date, default: null },
  updatedAt:  { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false
});

// Un progreso por user+lesson
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
