// src/models/Purchase.js
import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  
  // Información de pago
  stripePaymentIntentId: { type: String, unique: true, sparse: true },
  paypalOrderId: { type: String, unique: true, sparse: true },
  
  // Detalles de la transacción
  amountCents: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  paymentMethod: { type: String, enum: ['stripe', 'paypal', 'admin_granted'], required: true },
  
  // Estado de la compra
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], 
    default: 'pending',
    index: true
  },
  
  // Metadatos
  userEmail: { type: String, required: true }, // Para facturación
  courseTitle: { type: String, required: true }, // Snapshot
  
  // Información de facturación
  invoice: {
    number: { type: String, unique: true, sparse: true }, // AUTO-generado
    pdfUrl: { type: String }, // URL del PDF de factura
    billingAddress: {
      name: String,
      email: String,
      address: String,
      city: String,
      postalCode: String,
      country: String
    }
  },
  
  // Descuentos aplicados
  discount: {
    code: String,
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number, // Porcentaje (0-100) o centavos
    appliedAmountCents: Number // Descuento real aplicado
  },
  
  // Reembolsos
  refund: {
    status: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
    requestedAt: Date,
    reason: String,
    adminNotes: String,
    refundedAt: Date,
    refundAmountCents: Number,
    stripeRefundId: String
  },
  
  // Metadatos adicionales
  metadata: { type: Object, default: {} },
  completedAt: Date,
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

// Índices compuestos
purchaseSchema.index({ user: 1, course: 1 }, { unique: true }); // Un usuario solo puede comprar un curso una vez
purchaseSchema.index({ status: 1, createdAt: -1 });
purchaseSchema.index({ 'refund.status': 1, 'refund.requestedAt': -1 });

// Generar número de factura automáticamente
purchaseSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed' && !this.invoice.number) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: new Date(year, 0, 1) },
      'invoice.number': { $exists: true }
    });
    this.invoice.number = `FAC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Purchase', purchaseSchema);
