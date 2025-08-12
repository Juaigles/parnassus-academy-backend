import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  serial:   { type: String, required: true, unique: true, index: true },
  issuedAt: { type: Date, default: () => new Date(), required: true },
  pdfKey:   { type: String, default: null } // almacenamiento (S3/R2) si generas PDF real
}, { timestamps: true, versionKey: false });

certificateSchema.index({ userId:1, courseId:1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
