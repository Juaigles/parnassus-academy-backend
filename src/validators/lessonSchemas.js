import { z } from 'zod';
export const lessonCreateSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().optional(),
  resources: z.array(z.object({ title: z.string().min(1), url: z.string().url() })).default([]),
  durationSec: z.number().int().min(0).default(0),
  index: z.number().int().min(0)
});
export const lessonUpdateSchema = lessonCreateSchema.partial();
