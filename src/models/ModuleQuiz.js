import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: { type: [optionSchema], validate: v => v.length >= 2 }
}, { _id: false });

const moduleQuizSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, unique: true, index: true },
  passingScore: { type: Number, default: 70, min: 0, max: 100 },
  maxAttempts: { type: Number, default: 3, min: 1, max: 20 },
  questions: { type: [questionSchema], validate: v => v.length >= 3 }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } },
  toObject: { virtuals: true }
});

export default mongoose.model('ModuleQuiz', moduleQuizSchema);
