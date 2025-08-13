// Test rápido del validador
import { moduleQuizUpsertSchema } from './src/validators/moduleQuizSchemas.js';

const testData = {
  courseId: "689c8342445dd47640670389",
  moduleId: "689c83d3445dd4764067038f",
  passingScore: 70,
  maxAttempts: 3,
  questions: [
    {
      text: "¿Cómo se dice 'Hello' en español?",
      options: [
        {
          text: "Hola",
          isCorrect: true
        },
        {
          text: "Adiós",
          isCorrect: false
        }
      ]
    }
  ]
};

try {
  const result = moduleQuizUpsertSchema.parse(testData);
  console.log('✅ Validación exitosa:', JSON.stringify(result, null, 2));
} catch (error) {
  console.log('❌ Error de validación:', error.message);
}
