import { z } from 'zod';

// Final Quiz Schema
export const createFinalQuizSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    questions: z.array(z.object({
      question: z.string().min(1, 'La pregunta es requerida'),
      type: z.enum(['single', 'multiple', 'truefalse'], 'Tipo de pregunta inválido'),
      options: z.array(z.string()).min(2, 'Mínimo 2 opciones requeridas'),
      correctAnswers: z.array(z.number()).min(1, 'Al menos una respuesta correcta requerida'),
      points: z.number().positive('Los puntos deben ser positivos').default(1)
    })).min(1, 'Al menos una pregunta es requerida'),
    timeLimit: z.number().positive('El tiempo límite debe ser positivo').optional(),
    passingScore: z.number().min(0).max(100, 'El puntaje mínimo debe estar entre 0 y 100').default(70),
    maxAttempts: z.number().positive('Los intentos máximos deben ser positivos').default(3),
    isActive: z.boolean().default(true)
  }),
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido')
  })
});

// Start Final Attempt Schema
export const startFinalAttemptSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido')
  })
});

// Submit Final Attempt Schema
export const submitFinalAttemptSchema = z.object({
  body: z.object({
    attemptId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de intento inválido'),
    answers: z.array(z.object({
      questionIndex: z.number().int().min(0, 'Índice de pregunta inválido'),
      selectedOptions: z.array(z.number().int().min(0, 'Índice de opción inválido'))
    })).min(1, 'Al menos una respuesta es requerida')
  }),
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido')
  })
});

// Get Certificate Schema
export const getCertificateSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido')
  })
});

// Verify Certificate Schema
export const verifyCertificateSchema = z.object({
  params: z.object({
    serial: z.string().min(1, 'Serial del certificado es requerido')
  })
});

// Get Final Quiz Schema (params only)
export const getFinalQuizSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido')
  })
});
