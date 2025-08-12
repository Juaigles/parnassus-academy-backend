import { z } from 'zod';

export const videoAssetCreateSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  storageKey: z.string().min(3),
  durationSec: z.number().int().min(0).default(0),
  mimeType: z.string().min(3).optional(),
  transcripts: z.array(z.string()).optional()
});
