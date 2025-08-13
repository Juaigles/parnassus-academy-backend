import mongoose from 'mongoose';

const moneySchema = new mongoose.Schema({
  type: { type: String, enum: ['one_time','subscription'], required: true },
  amountCents: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'EUR' },
  interval: { type: String, enum: [null,'month','year'], default: null }, // solo si subscription
}, { _id: false });

const resourceSchema = new mongoose.Schema({
  kind: { type: String, enum: ['pdf','video','link'], required: true },
  title: { type: String, required: true },
  url: { type: String },                               // o usa assetId si gestionas S3
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' }
}, { _id: false });

const methodologyItemSchema = new mongoose.Schema({
  title: String,
  description: String,
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
  quote: { type: String, required: true },
  authorName: { type: String, required: true },
  countryCode: { type: String, default: 'ES' },        // ISO 3166-1 alpha-2
}, { _id: false });

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
}, { _id: false });

const marketingSchema = new mongoose.Schema({
  card: {
    coverImageUrl: String,
    subtitle: String,
    learnOutcomes: [String],     // “Lo que aprenderás”
    badges: [String],            // ej: ["20 horas","Certificado"]
  },
  hero: {
    previewVideoAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoAsset' }, // público
    posterImageUrl: String,
  },
  objectives: [{ title: String, description: String }],
  methodology: [methodologyItemSchema],
  resources: [resourceSchema],   // PDF informativo + link al hero
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  testimonials: [testimonialSchema],
  faqs: [faqSchema],
}, { _id: false });

const statsSchema = new mongoose.Schema({
  totalModules: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  totalDurationSec: { type: Number, default: 0 },
  hasCertificate: { type: Boolean, default: true },
  hasQuizzes: { type: Boolean, default: false },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  title: { type: String, required: true, trim: true },
  slug:  { type: String, required: true, unique: true },    // único global para URLs
  description: { type: String, default: '' },
  excerpt: { type: String, default: '' },                   // resumen para tarjeta
  level: { type: String, enum: ['A1','A2','B1','B2','C1','C2'], default: 'A1', index: true },

  visibility: { type: String, enum: ['public','unlisted'], default: 'public' },
  status: { type: String, enum: ['draft','submitted','approved','published'], default: 'draft', index: true },
  publishedAt: { type: Date },

  pricing: { type: moneySchema, required: true },
  tags: { type: [String], default: [] },                   // para recomendaciones/búsqueda

  marketing: { type: marketingSchema, default: {} },       // contenido de página
  stats: { type: statsSchema, default: {} },               // métricas cacheadas

  meta: { type: Object, default: {} },                     // libre
}, { 
  timestamps: true, 
  versionKey: false,
  toJSON: { virtuals: true, transform(_d,r){ r.id=String(r._id); delete r._id; } }
});

export default mongoose.model('Course', courseSchema);
