// src/models/Wishlist.js
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course'
  }],
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

// Un usuario solo puede tener una wishlist
wishlistSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
