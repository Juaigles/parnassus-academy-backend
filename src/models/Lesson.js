import mongoose from 'mongoose';
const resourceSchema = new mongoose.Schema({ title: String, url: String }, { _id:false });
const lessonSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug:  { type: String, required: true },
  content: { type: String, default: '' },           // teoría
  resources: { type: [resourceSchema], default: [] },// recursos por lección
  durationSec: { type: Number, default: 0 },
  index: { type: Number, required: true, min: 0 },
  hasQuiz: { type: Boolean, default: false }
}, { timestamps: true, versionKey:false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});
lessonSchema.index({ moduleId:1, index:1 }, { unique: true });
lessonSchema.index({ courseId:1, slug:1 }, { unique: true });
export default mongoose.model('Lesson', lessonSchema);
