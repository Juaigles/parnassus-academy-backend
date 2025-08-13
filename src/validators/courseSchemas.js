// src/validators/courseSchemas.js
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const pricingSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('free') }),
  z.object({
    type: z.literal('one_time'),
    amountCents: z.number().int().nonnegative(),
    currency: z.string().length(3)
  }),
  z.object({
    type: z.literal('subscription'),
    amountCents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    interval: z.enum(['week','month','year','month']) // deja 'month' si sólo usas mensual
  })
]);

const baseCreate = z.object({
  title: z.string().min(3).max(140),
  slug: z.string().regex(slugRegex, 'slug inválido: usa minúsculas, números y guiones'),
  description: z.string().max(2000).optional().default(''),
  excerpt: z.string().max(200).optional().default(''),
  level: z.string().optional(),
  visibility: z.enum(['public','unlisted']).default('public'),
  pricing: pricingSchema,
  meta: z.object({
    level: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).partial().optional(),
  tags: z.array(z.string()).optional(),
  // marketing lo aceptamos tal cual venga sin validar a fondo aquí
  marketing: z.record(z.any()).optional()
}).passthrough();

export const courseCreateSchema = baseCreate.transform(v => {
  // si mandas tags en raíz y no mandas meta.tags, los reflejamos en meta.tags
  if (v.tags && (!v.meta || !v.meta.tags)) {
    v.meta = { ...(v.meta || {}), tags: v.tags };
  }
  return v;
});

export const courseUpdateSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  slug: z.string().regex(slugRegex, 'slug inválido: usa minúsculas, números y guiones').optional(),
  description: z.string().max(2000).optional(),
  excerpt: z.string().max(200).optional(),
  level: z.string().optional(),
  visibility: z.enum(['public','unlisted']).optional(),
  pricing: pricingSchema.optional(),
  meta: z.object({
    level: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).partial().optional(),
  tags: z.array(z.string()).optional(),
  marketing: z.record(z.any()).optional()
}).passthrough().transform(v => {
  if (v.tags && (!v.meta || !v.meta.tags)) {
    v.meta = { ...(v.meta || {}), tags: v.tags };
  }
  return v;
});

export const marketingPatchSchema = z.object({
  card: z.object({
    coverImageUrl: z.string().url().optional(),
    subtitle: z.string().max(140).optional(),
    learnOutcomes: z.array(z.string().min(1)).optional(),
    badges: z.array(z.string().min(1)).optional()
  }).partial().optional(),

  hero: z.object({
    previewUrl: z.string().url().optional(),
    posterImageUrl: z.string().url().optional()
  }).partial().optional(),

  objectives: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1)
  })).optional(),

  methodology: z.array(z.string().min(1)).optional(),

  resources: z.array(z.object({
    type: z.enum(['pdf','video','link']),
    title: z.string().min(1),
    url: z.string().url()
  })).optional(),

  instructor: z.object({
    name: z.string().min(1).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().optional()
  }).partial().optional(),

  testimonials: z.array(z.object({
    quote: z.string().min(1),
    studentName: z.string().min(1),
    country: z.string().min(2).max(2).optional()
  })).optional(),

  faqs: z.array(z.object({
    q: z.string().min(1),
    a: z.string().min(1)
  })).optional()
}).strict();
