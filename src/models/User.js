// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['student'] },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
};

export default mongoose.model('User', userSchema);
