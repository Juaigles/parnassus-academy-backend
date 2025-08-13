import * as quizRepo from '../repositories/quizRepo.js';
import * as finalQuizRepo from '../repositories/finalQuizRepo.js';
import * as attemptRepo from '../repositories/attemptRepo.js';
import * as finalAttemptRepo from '../repositories/finalAttemptRepo.js';
import * as gatingService from './gatingService.js';
import * as certificateService from './certificateService.js';
import AppError from '../libs/appError.js';

export async function createFinalQuiz({ courseId, quizData, teacherId }) {
  // Crear el quiz base
  const quiz = await quizRepo.create(quizData);
  
  // Crear la relación curso-quiz final
  const finalQuiz = await finalQuizRepo.create({
    course: courseId,
    quiz: quiz.id,
    passPctOverride: quizData.passPctOverride
  });

  return { finalQuiz, quiz };
}

export async function getFinalQuizForStudent({ courseId, userId }) {
  const finalQuiz = await finalQuizRepo.findByCourse(courseId);
  if (!finalQuiz) {
    throw new AppError('Final quiz not found', 404);
  }

  // Verificar si el student puede tomar el quiz final
  const canStart = await gatingService.canStartFinalQuiz({ userId, courseId });
  if (!canStart.ok) {
    throw new AppError('Cannot access final quiz: ' + canStart.reason, 403);
  }

  // Devolver quiz sin respuestas correctas
  const quiz = { ...finalQuiz.quiz.toObject() };
  quiz.questions = quiz.questions.map(q => ({
    ...q,
    options: q.options.map(opt => ({ text: opt.text })) // Sin campo 'correct'
  }));

  return {
    id: finalQuiz.id,
    quiz,
    courseId,
    attempts: await attemptRepo.countByUserAndQuiz(userId, quiz.id)
  };
}

export async function startAttempt({ courseId, userId }) {
  const finalQuiz = await finalQuizRepo.findByCourse(courseId);
  if (!finalQuiz) {
    throw new AppError('Final quiz not found', 404);
  }

  const canStart = await gatingService.canStartFinalQuiz({ userId, courseId });
  if (!canStart.ok) {
    throw new AppError('Cannot start final quiz: ' + canStart.reason, 403);
  }

  // Crear attempt
  const attempt = await attemptRepo.create({
    quiz: finalQuiz.quiz._id,
    user: userId,
    answers: [],
    scorePct: 0,
    passed: false,
    startedAt: new Date()
  });

  return { attemptId: attempt.id, quiz: finalQuiz.quiz };
}

export async function submitAttempt({ attemptId, answers, userId }) {
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

  // Si aprobó, generar certificado
  let certificate = null;
  if (passed) {
    // Buscar el finalQuiz para obtener el courseId
    const finalQuiz = await finalQuizRepo.findByQuiz(quiz.id);
    if (finalQuiz) {
      certificate = await certificateService.issueCertificate({ 
        userId, 
        courseId: finalQuiz.course 
      });
    }
  }

  return {
    attempt: updatedAttempt,
    scorePct,
    passed,
    passPct: quiz.passPct,
    certificate
  };
}

export async function listMyAttempts({ courseId, userId }) {
  const finalQuiz = await finalQuizRepo.findByCourse(courseId);
  if (!finalQuiz) {
    throw new AppError('Final quiz not found', 404);
  }

  return attemptRepo.listByUserAndQuiz(userId, finalQuiz.quiz._id);
}

export async function deleteFinalQuiz({ courseId, teacherId }) {
  const finalQuiz = await finalQuizRepo.findByCourse(courseId);
  if (!finalQuiz) {
    throw new AppError('Final quiz not found', 404);
  }

  // TODO: Verificar permisos de teacher
  
  // Eliminar quiz y relación
  await quizRepo.deleteById(finalQuiz.quiz._id);
  await finalQuizRepo.deleteByCourse(courseId);

  return { deleted: true };
}
