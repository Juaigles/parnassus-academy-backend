// src/models/DiscountCode.js
import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  
  // Configuración del descuento
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true }, // Porcentaje (0-100) o centavos
  
  // Restricciones
  minAmountCents: { type: Number, default: 0 }, // Compra mínima requerida
  maxUsages: { type: Number, default: null }, // null = ilimitado
  usedCount: { type: Number, default: 0 },
  
  // Fechas de validez
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  
  // Restricciones de curso
  applicableCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // vacío = todos
  excludedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  // Restricciones de usuario
  applicableToNewUsersOnly: { type: Boolean, default: false },
  oneTimePerUser: { type: Boolean, default: true },
  
  // Metadatos
  isActive: { type: Boolean, default: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

// Validar que el código esté activo y dentro de fechas
discountCodeSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.maxUsages === null || this.usedCount < this.maxUsages);
};

// Calcular descuento para un curso específico
discountCodeSchema.methods.calculateDiscount = function(coursePriceCents, courseId) {
  // Verificar si el curso es aplicable
  if (this.applicableCourses.length > 0 && !this.applicableCourses.includes(courseId)) {
    return 0;
  }
  if (this.excludedCourses.includes(courseId)) {
    return 0;
  }
  
  // Verificar compra mínima
  if (coursePriceCents < this.minAmountCents) {
    return 0;
  }
  
  if (this.type === 'percentage') {
    return Math.floor(coursePriceCents * (this.value / 100));
  } else {
    return Math.min(this.value, coursePriceCents); // No puede ser mayor al precio
  }
};

export default mongoose.model('DiscountCode', discountCodeSchema);
