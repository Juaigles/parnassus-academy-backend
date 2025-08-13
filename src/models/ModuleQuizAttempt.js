import mongoose from 'mongoose';

const moduleQuizAttemptSchema = new mongoose.Schema({
  moduleQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'ModuleQuiz', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

moduleQuizAttemptSchema.index({ user: 1, moduleQuiz: 1 });

export default mongoose.model('ModuleQuizAttempt', moduleQuizAttemptSchema);
