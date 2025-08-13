import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  correct: { type: Boolean, default: false }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['single', 'multi', 'truefalse'], required: true },
  prompt: { type: String, required: true, trim: true },
  options: { type: [optionSchema], required: true },
  points: { type: Number, default: 1, min: 0 }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  questions: { type: [questionSchema], required: true, validate: v => v.length >= 1 },
  passPct: { type: Number, default: 70, min: 0, max: 100 }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

export default mongoose.model('Quiz', quizSchema);
