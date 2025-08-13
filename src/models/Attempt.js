import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true, min: 0 },
  selectedIndexes: { type: [Number], default: [] }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: { type: [answerSchema], default: [] },
  scorePct: { type: Number, required: true, min: 0, max: 100 },
  passed: { type: Boolean, required: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

attemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });

export default mongoose.model('Attempt', attemptSchema);
