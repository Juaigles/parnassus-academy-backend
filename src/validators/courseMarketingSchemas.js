// src/validators/courseMarketingSchemas.js
import { z } from 'zod';

const url = z.string().url('URL inválida');

const CardSchema = z.object({
  coverImageUrl: url.optional(),
  subtitle: z.string().max(140).optional(),
  learnOutcomes: z.array(z.string()).max(12).optional(),
  badges: z.array(z.string()).max(8).optional()
}).partial();

const HeroSchema = z.object({
  previewUrl: url.optional(),
  posterImageUrl: url.optional()
}).partial();

const GoalSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(5).max(500)
});

const SyllabusItemSchema = z.object({
  moduleTitle: z.string().min(3).max(120),
  lessonTitles: z.array(z.string()).min(1).max(50)
});

const MethodologySchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(5).max(400)
});

const ResourceSchema = z.object({
  title: z.string().min(2).max(120),
  type: z.enum(['pdf','video','link']).default('link'),
  url
});

const TeacherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  title: z.string().max(120).optional(),
  avatarUrl: url.optional(),
  bio: z.string().max(1000).optional()
}).partial();

const TestimonialSchema = z.object({
  quote: z.string().min(5).max(500),
  studentName: z.string().min(2).max(80),
  country: z.string().max(80).optional()
});

const FaqSchema = z.object({
  q: z.string().min(3).max(160),
  a: z.string().min(3).max(800)
});

export const marketingPatchSchema = z.object({
  card: CardSchema.optional(),
  hero: HeroSchema.optional(),
  goals: z.array(GoalSchema).optional(),
  outcomes: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  syllabus: z.array(SyllabusItemSchema).optional(),
  methodologies: z.array(MethodologySchema).max(6).optional(),
  resources: z.array(ResourceSchema).max(10).optional(),
  teacher: TeacherSchema.optional(),
  testimonials: z.array(TestimonialSchema).max(8).optional(),
  faq: z.array(FaqSchema).max(12).optional()
})
  .passthrough() // <— conservar otras claves como objectives, faqs, methodology si las usas
  .refine(obj => Object.keys(obj).length > 0, { message: 'Debes enviar al menos un campo de marketing' });
