import mongoose from 'mongoose';
const courseSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug:  { type: String, required: true },
  description: { type: String, default: '' },
  visibility: { type: String, enum: ['public','unlisted'], default: 'public' },
  status: { type: String, enum: ['draft','submitted','approved','published'], default: 'draft', index: true },
  pricing: { type: Object, default: {} }
}, { timestamps: true, versionKey: false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});
courseSchema.index({ owner:1, slug:1 }, { unique: true });
export default mongoose.model('Course', courseSchema);
