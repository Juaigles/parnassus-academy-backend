import mongoose from 'mongoose';

const moduleQuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

moduleQuizSchema.index({ course: 1, module: 1 }, { unique: true });

export default mongoose.model('ModuleQuiz', moduleQuizSchema);
