import { z } from 'zod';

export const finalQuizUpsertSchema = z.object({
  courseId: z.string().min(1),
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1).max(20).default(3),
  questions: z.array(z.object({
    text: z.string().min(3),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean()
    })).min(2)
  })).min(5)
});

export const finalQuizAttemptSchema = z.object({
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0),
    selectedIndexes: z.array(z.number().int().min(0)).default([])
  })).min(1)
});
