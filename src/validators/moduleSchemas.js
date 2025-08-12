import { z } from 'zod';
export const moduleCreateSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2),
  index: z.number().int().min(0)
});
export const moduleUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  index: z.number().int().min(0).optional()
});
