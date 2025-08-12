import mongoose from 'mongoose';
const moduleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true },
  index: { type: Number, required: true, min: 0 }
}, { timestamps: true, versionKey:false });
moduleSchema.index({ courseId:1, index:1 }, { unique: true });
export default mongoose.model('Module', moduleSchema);
