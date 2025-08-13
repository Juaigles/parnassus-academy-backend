import { z } from 'zod';

const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['pdf', 'video', 'link']).optional(), // Formato estándar
  kind: z.enum(['pdf', 'video', 'link']).optional()  // Formato alternativo
}).refine(data => data.type || data.kind, {
  message: "Debe incluir 'type' o 'kind' para el recurso"
});

export const lessonCreateSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2).optional(),
  content: z.string().optional(),
  contentHtml: z.string().optional(),
  resources: z.array(resourceSchema).default([]),
  durationSec: z.number().int().min(0).default(0),
  index: z.number().int().min(0)
});
export const lessonUpdateSchema = lessonCreateSchema.partial();
