import * as quizRepo from '../repositories/quizRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as attemptRepo from '../repositories/attemptRepo.js';
import * as moduleQuizAttemptRepo from '../repositories/moduleQuizAttemptRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as videoProgressService from './videoProgressService.js';
import * as gatingService from './gatingService.js';
import AppError from '../libs/appError.js';

export async function upsertModuleQuiz({ moduleId, quiz, user }) {
  // Crear el quiz base
  const createdQuiz = await quizRepo.create(quiz);
  
  // Buscar si ya existe un moduleQuiz para este módulo
  let moduleQuiz = await moduleQuizRepo.findByModule(moduleId);
  
  if (moduleQuiz) {
    // Actualizar el quiz existente
    await quizRepo.updateById(moduleQuiz.quiz._id, quiz);
    return moduleQuiz;
  } else {
    // Crear nuevo moduleQuiz
    moduleQuiz = await moduleQuizRepo.create({
      course: quiz.courseId, // Viene en el payload del controller
      module: moduleId,
      quiz: createdQuiz.id
    });
    return moduleQuiz;
  }
}

export async function getModuleQuiz({ moduleId, viewer }) {
  const moduleQuiz = await moduleQuizRepo.findByModule(moduleId);
  if (!moduleQuiz) {
    throw new AppError('Module quiz not found', 404);
  }

  const isTeacher = viewer?.roles?.includes('teacher') || viewer?.roles?.includes('admin');
  
  if (!isTeacher) {
    // Verificar si el student puede tomar el quiz
    const canStart = await gatingService.canStartModuleQuiz({ userId: viewer?.id, moduleId });
    if (!canStart.ok) {
      throw new AppError('Cannot access module quiz: ' + canStart.reason, 403);
    }
  }

  // Si es teacher, devolver quiz completo; si es student, sin respuestas correctas
  if (isTeacher) {
    return moduleQuiz;
  } else {
    const quiz = { ...moduleQuiz.quiz.toObject() };
    quiz.questions = quiz.questions.map(q => ({
      ...q,
      options: q.options.map(opt => ({ text: opt.text })) // Sin campo 'correct'
    }));

    return {
      id: moduleQuiz.id,
      quiz,
      moduleId,
      attempts: await attemptRepo.countByUserAndQuiz(viewer.id, quiz.id)
    };
  }
}

export async function submitModuleAttempt({ moduleId, userId, answers }) {
  const moduleQuiz = await moduleQuizRepo.findByModule(moduleId);
  if (!moduleQuiz) {
    throw new AppError('Module quiz not found', 404);
  }

  const canStart = await gatingService.canStartModuleQuiz({ userId, moduleId });
  if (!canStart.ok) {
    throw new AppError('Cannot start module quiz: ' + canStart.reason, 403);
  }

  // Crear attempt
  const attempt = await attemptRepo.create({
    quiz: moduleQuiz.quiz._id,
    user: userId,
    answers: [],
    scorePct: 0,
    passed: false,
    startedAt: new Date()
  });

  // Calcular puntuación y actualizar attempt
  const result = await this.submitAttempt({ attemptId: attempt.id, answers, userId });
  
  return result;
}

async function submitAttempt({ attemptId, answers, userId }) {
  const attempt = await attemptRepo.findById(attemptId);
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  if (String(attempt.user) !== String(userId)) {
    throw new AppError('Forbidden', 403);
  }

  if (attempt.finishedAt) {
    throw new AppError('Attempt already submitted', 400);
  }

  // Obtener el quiz con las respuestas correctas
  const quiz = await quizRepo.findById(attempt.quiz);
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // Calcular puntuación
  let totalPoints = 0;
  let earnedPoints = 0;

  quiz.questions.forEach((question, qIndex) => {
    totalPoints += question.points;
    
    const userAnswer = answers.find(a => a.questionIndex === qIndex);
    if (!userAnswer) return;

    if (question.type === 'single') {
      const correctOption = question.options.findIndex(opt => opt.correct);
      if (userAnswer.selectedIndexes.includes(correctOption)) {
        earnedPoints += question.points;
      }
    } else if (question.type === 'multi') {
      const correctIndexes = question.options.map((opt, i) => opt.correct ? i : -1).filter(i => i >= 0);
      const userSelections = userAnswer.selectedIndexes.sort();
      if (JSON.stringify(correctIndexes.sort()) === JSON.stringify(userSelections)) {
        earnedPoints += question.points;
      }
    } else if (question.type === 'truefalse') {
      const correctAnswer = question.options[0].correct ? 0 : 1;
      if (userAnswer.selectedIndexes.includes(correctAnswer)) {
        earnedPoints += question.points;
      }
    }
  });

  const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePct >= quiz.passPct;

  // Actualizar attempt
  const updatedAttempt = await attemptRepo.updateById(attemptId, {
    answers,
    scorePct,
    passed,
    finishedAt: new Date()
  });

  // Si aprobó, actualizar progreso usando el nuevo sistema
  if (passed) {
    const moduleQuiz = await moduleQuizRepo.findByModule(attempt.module);
    if (moduleQuiz) {
      await videoProgressService.applyQuizResult({
        userId,
        courseId: moduleQuiz.course,
        moduleId: moduleQuiz.module,
        quizType: 'module',
        score: scorePct,
        passed
      });
    }
  }

  return {
    attemptId: updatedAttempt.id,
    score: scorePct,
    passed,
    passPct: quiz.passPct
  };
}

export async function listMyModuleAttempts({ moduleId, userId }) {
  const moduleQuiz = await moduleQuizRepo.findByModule(moduleId);
  if (!moduleQuiz) {
    throw new AppError('Module quiz not found', 404);
  }

  return attemptRepo.listByUserAndQuiz(userId, moduleQuiz.quiz._id);
}

export async function deleteModuleQuiz({ moduleId, user }) {
  const moduleQuiz = await moduleQuizRepo.findByModule(moduleId);
  if (!moduleQuiz) {
    throw new AppError('Module quiz not found', 404);
  }

  // TODO: Verificar permisos de teacher usando gatingService
  
  // Eliminar quiz y relación
  await quizRepo.deleteById(moduleQuiz.quiz._id);
  await moduleQuizRepo.deleteByModule(moduleId);

  return { ok: true };
}
