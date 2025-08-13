import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  index: { type: Number, required: true, min: 0 },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  required: { type: Boolean, default: true }
}, { 
  timestamps: true, 
  versionKey: false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

moduleSchema.index({ course: 1, index: 1 }, { unique: true });

// Hook para actualizar el syllabus cuando se modifica un módulo
moduleSchema.post(['save', 'findOneAndUpdate', 'findOneAndDelete'], async function(doc) {
  if (doc && doc.course) {
    try {
      const { updateCourseSyllabus } = await import('../services/courseService.js');
      await updateCourseSyllabus(doc.course);
    } catch (error) {
      console.error('Error updating course syllabus after module change:', error);
    }
  }
});

moduleSchema.post('deleteMany', async function() {
  // Si se eliminan múltiples módulos, necesitamos actualizar todos los cursos afectados
  if (this.getFilter().course) {
    try {
      const { updateCourseSyllabus } = await import('../services/courseService.js');
      await updateCourseSyllabus(this.getFilter().course);
    } catch (error) {
      console.error('Error updating course syllabus after modules deletion:', error);
    }
  }
});

export default mongoose.model('Module', moduleSchema);
