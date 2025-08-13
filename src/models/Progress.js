import mongoose from 'mongoose';

// Progreso detallado por lección
const lessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  
  // Progreso de video
  video: {
    percentMax: { type: Number, default: 0, min: 0, max: 1 }, // 0.0 a 1.0
    lastPositionSec: { type: Number, default: 0 },
    secondsWatched: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  },
  
  // Progreso de quiz (si existe)
  quiz: {
    attempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false }
  },
  
  // Estado general de la lección
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { _id: false });

// Resultados de quiz por módulo
const moduleResultSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  passed: { type: Boolean, default: false },
  scorePct: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  passedAt: { type: Date }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  
  // Progreso detallado por lección
  lessons: [lessonProgressSchema],
  
  // Resultados de quizzes de módulo
  modules: [moduleResultSchema],
  
  // Progreso general del curso
  coursePct: { type: Number, default: 0, min: 0, max: 100 },
  
  // Quiz final del curso
  finalQuiz: {
    passed: { type: Boolean, default: false },
    scorePct: { type: Number, default: 0 },
    passedAt: { type: Date }
  },
  
  // Referencias rápidas
  lastLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }
}, { 
  timestamps: true, 
  versionKey: false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

progressSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
