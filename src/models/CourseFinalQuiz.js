import mongoose from 'mongoose';

const courseFinalQuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  passPctOverride: { type: Number, min: 0, max: 100 } // Si quiere override del passPct del quiz base
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

courseFinalQuizSchema.index({ course: 1 }, { unique: true });

export default mongoose.model('CourseFinalQuiz', courseFinalQuizSchema);
