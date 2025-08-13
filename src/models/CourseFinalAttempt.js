import mongoose from 'mongoose';

const courseFinalAttemptSchema = new mongoose.Schema({
  finalQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseFinalQuiz', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

courseFinalAttemptSchema.index({ user: 1, finalQuiz: 1 });

export default mongoose.model('CourseFinalAttempt', courseFinalAttemptSchema);
