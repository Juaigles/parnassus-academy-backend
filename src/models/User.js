import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['student'] }, // 'admin','teacher','student'
  emailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active','blocked'], default: 'active' },
  billingCustomerId: { type: String, default: null }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform(_d, r){ r.id=String(r._id); delete r._id; delete r.passwordHash; } },
  toObject: { virtuals: true }
});
export default mongoose.model('User', userSchema);
