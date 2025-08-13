import { z } from 'zod';

const questionSchema = z.object({
  text: z.string().min(3),  // Cambio: 'prompt' -> 'text'
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean()  // Cambio: 'correct' -> 'isCorrect'
  })).min(2),
  points: z.number().int().min(1).default(1)
});

export const moduleQuizUpsertSchema = z.object({
  courseId: z.string().min(1),         // Agregar courseId
  moduleId: z.string().min(1),
  passingScore: z.number().int().min(0).max(100).default(70),  // Cambio: 'passPct' -> 'passingScore'
  maxAttempts: z.number().int().min(1).default(3),  // Agregar maxAttempts
  questions: z.array(questionSchema).min(1)  // Mover questions al nivel raíz
});

export const moduleQuizAttemptSchema = z.object({
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0),
    selectedIndexes: z.array(z.number().int().min(0)).default([])
  })).min(1)
});
