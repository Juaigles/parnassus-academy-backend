// src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'purchase_completed',
      'course_update',
      'new_lesson',
      'achievement_unlocked',
      'reminder_study',
      'instructor_announcement',
      'review_received',
      'certificate_ready'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    courseId: mongoose.Schema.Types.ObjectId,
    lessonId: mongoose.Schema.Types.ObjectId,
    achievementId: String,
    url: String
  },
  read: { type: Boolean, default: false },
  readAt: Date,
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  sentChannels: {
    inApp: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
