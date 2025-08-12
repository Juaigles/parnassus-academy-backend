import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: { type: [optionSchema], validate: v => v.length >= 2 }
}, { _id: false });

const courseFinalQuizSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true, index: true },
  passingScore: { type: Number, default: 70, min: 0, max: 100 },
  maxAttempts: { type: Number, default: 3, min: 1, max: 20 },
  questions: { type: [questionSchema], validate: v => v.length >= 5 }
}, { timestamps: true, versionKey: false });

export default mongoose.model('CourseFinalQuiz', courseFinalQuizSchema);
