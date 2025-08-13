// src/models/Progress.js
import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watchedSec: { type: Number, default: 0 },   // solo si hay vídeo
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { _id: false });

const moduleResultSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  passed: { type: Boolean, default: false },
  scorePct: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  passedAt: { type: Date }
}, { _id: false });

const courseResultSchema = new mongoose.Schema({
  passed: { type: Boolean, default: false },
  scorePct: { type: Number, default: 0 },
  passedAt: { type: Date },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true, required: true },
  lessons: { type: [lessonProgressSchema], default: [] },
  modules: { type: [moduleResultSchema], default: [] },
  course: { type: courseResultSchema, default: {} },
  // caches de % (se recalculan en el servicio)
  coursePct: { type: Number, default: 0 },
  modulePctById: { type: Map, of: Number, default: {} }
}, { timestamps: true });

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
