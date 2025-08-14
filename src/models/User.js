// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['student'] },
  emailVerified: { type: Boolean, default: false },
  
  // === 2FA FIELDS ===
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorBackupCodes: [{ type: String }],
  
  // === ANALYTICS FIELDS ===
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: 'es' },
  timezone: { type: String, default: 'America/Mexico_City' },
  
}, { timestamps: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
};

export default mongoose.model('User', userSchema);
