import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['pdf', 'video', 'link'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  index: { type: Number, required: true, min: 0 },
  title: { type: String, required: true, trim: true },
  contentHtml: { type: String, default: '' },
  durationSec: { type: Number, default: 0 },
  videoAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoAsset' },
  resources: { type: [resourceSchema], default: [] },
  required: { type: Boolean, default: true }
}, { 
  timestamps: true, 
  versionKey: false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

lessonSchema.index({ course: 1, module: 1, index: 1 }, { unique: true });

// Hook para actualizar el syllabus cuando se modifica una lección
lessonSchema.post(['save', 'findOneAndUpdate', 'findOneAndDelete'], async function(doc) {
  if (doc && doc.course) {
    try {
      const { updateCourseSyllabus } = await import('../services/courseService.js');
      await updateCourseSyllabus(doc.course);
    } catch (error) {
      console.error('Error updating course syllabus after lesson change:', error);
    }
  }
});

lessonSchema.post('deleteMany', async function() {
  // Si se eliminan múltiples lecciones, necesitamos actualizar el curso afectado
  if (this.getFilter().course) {
    try {
      const { updateCourseSyllabus } = await import('../services/courseService.js');
      await updateCourseSyllabus(this.getFilter().course);
    } catch (error) {
      console.error('Error updating course syllabus after lessons deletion:', error);
    }
  }
});

export default mongoose.model('Lesson', lessonSchema);
