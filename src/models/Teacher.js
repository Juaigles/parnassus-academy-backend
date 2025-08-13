import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoUrl: { type: String },
  bioShort: { type: String, default: '' },
  bioLong: { type: String, default: '' },
  socials: [{ kind: String, url: String }],
}, { timestamps: true, versionKey: false });

export default mongoose.model('Teacher', teacherSchema);
