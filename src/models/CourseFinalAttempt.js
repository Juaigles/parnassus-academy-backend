import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true, min: 0 },
  selectedIndexes: { type: [Number], default: [] }
}, { _id: false });

const finalAttemptSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  finalQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseFinalQuiz', required: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  answers:  { type: [answerSchema], default: [] },
  score:    { type: Number, required: true, min: 0, max: 100 },
  passed:   { type: Boolean, required: true }
}, { timestamps: true, versionKey: false });

finalAttemptSchema.index({ userId:1, finalQuizId:1, createdAt:-1 });

export default mongoose.model('CourseFinalAttempt', finalAttemptSchema);
