import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  hash: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now, required: true },
  meta: { type: Object, default: {} }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; } }
});

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
