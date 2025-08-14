// src/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxLength: 100 },
  comment: { type: String, required: true, maxLength: 1000 },
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reported: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },
  metadata: {
    completionPercentage: Number,
    timeSpent: Number,
    deviceType: String
  }
}, {
  timestamps: true
});

// Índices para performance
reviewSchema.index({ course: 1, status: 1 });
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ rating: -1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
