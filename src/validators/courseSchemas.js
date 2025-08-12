import { z } from 'zod';
export const courseCreateSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  visibility: z.enum(['public','unlisted']).default('public'),
  pricing: z.record(z.any()).optional()
});
export const courseUpdateSchema = courseCreateSchema.partial();
