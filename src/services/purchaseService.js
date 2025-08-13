// src/services/purchaseService.js
import Purchase from '../models/Purchase.js';
import DiscountCode from '../models/DiscountCode.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import AppError from '../libs/appError.js';
import { stripeService } from './stripeService.js';
import * as emailService from './emailService.js';

/**
 * Verificar si un usuario tiene acceso a un curso
 */
export async function hasAccessToCourse(userId, courseId) {
  // Verificar compra completada
  const purchase = await Purchase.findOne({
    user: userId,
    course: courseId,
    status: 'completed'
  });
  
  return !!purchase;
}

/**
 * Verificar si un usuario puede acceder a un curso (incluyendo roles)
 */
export async function canAccessCourse(user, courseId) {
  // Admin: acceso total
  if (user.roles.includes('admin')) {
    return { hasAccess: true, reason: 'admin' };
  }
  
  // Teacher: solo a sus cursos
  if (user.roles.includes('teacher')) {
    const course = await Course.findById(courseId);
    if (course && String(course.owner) === String(user.id)) {
      return { hasAccess: true, reason: 'owner' };
    }
  }
  
  // Student: solo a cursos comprados
  const purchased = await hasAccessToCourse(user.id, courseId);
  if (purchased) {
    return { hasAccess: true, reason: 'purchased' };
  }
  
  return { hasAccess: false, reason: 'not_purchased' };
}

/**
 * Obtener cursos del usuario (comprados o como teacher)
 */
export async function getUserCourses(userId) {
  const user = await User.findById(userId);
  
  let courses = [];
  
  // Cursos comprados
  if (user.roles.includes('student')) {
    const purchases = await Purchase.find({
      user: userId,
      status: 'completed'
    }).populate('course');
    
    courses = courses.concat(purchases.map(p => ({
      ...p.course.toJSON(),
      accessType: 'purchased',
      purchaseDate: p.completedAt
    })));
  }
  
  // Cursos como teacher
  if (user.roles.includes('teacher')) {
    const ownedCourses = await Course.find({ owner: userId });
    courses = courses.concat(ownedCourses.map(c => ({
      ...c.toJSON(),
      accessType: 'owner'
    })));
  }
  
  // Admin ve todos
  if (user.roles.includes('admin')) {
    const allCourses = await Course.find({});
    courses = allCourses.map(c => ({
      ...c.toJSON(),
      accessType: 'admin'
    }));
  }
  
  return courses;
}

/**
 * Crear intención de compra
 */
export async function createPurchaseIntent(userId, courseId, discountCode = null) {
  // Verificar que el curso existe y está publicado
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  
  if (course.status !== 'published') {
    throw new AppError('Course is not available for purchase', 400);
  }
  
  // Verificar que el usuario no ya compró el curso
  const existingPurchase = await Purchase.findOne({
    user: userId,
    course: courseId,
    status: { $in: ['completed', 'pending'] }
  });
  
  if (existingPurchase) {
    throw new AppError('Course already purchased or purchase pending', 400);
  }
  
  const user = await User.findById(userId);
  let finalAmountCents = course.pricing.amountCents;
  let appliedDiscount = null;
  
  // Aplicar descuento si se proporciona
  if (discountCode) {
    const discount = await DiscountCode.findOne({ 
      code: discountCode.toUpperCase(),
      isActive: true 
    });
    
    if (discount && discount.isValid()) {
      const discountAmount = discount.calculateDiscount(finalAmountCents, courseId);
      if (discountAmount > 0) {
        finalAmountCents -= discountAmount;
        appliedDiscount = {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          appliedAmountCents: discountAmount
        };
      }
    }
  }
  
  // Crear registro de compra
  const purchase = new Purchase({
    user: userId,
    course: courseId,
    amountCents: finalAmountCents,
    currency: course.pricing.currency,
    paymentMethod: 'stripe',
    status: 'pending',
    userEmail: user.email,
    courseTitle: course.title,
    discount: appliedDiscount
  });
  
  await purchase.save();
  
  // Crear PaymentIntent en Stripe
  const paymentIntent = await stripeService.createPaymentIntent({
    amount: finalAmountCents,
    currency: course.pricing.currency,
    metadata: {
      purchaseId: purchase.id,
      userId: userId,
      courseId: courseId,
      courseTitle: course.title
    }
  });
  
  // Actualizar purchase con el PaymentIntent ID
  purchase.stripePaymentIntentId = paymentIntent.id;
  await purchase.save();
  
  return {
    purchase: purchase,
    clientSecret: paymentIntent.client_secret,
    originalAmount: course.pricing.amountCents,
    finalAmount: finalAmountCents,
    discount: appliedDiscount
  };
}

/**
 * Confirmar compra (llamado por webhook de Stripe)
 */
export async function confirmPurchase(stripePaymentIntentId) {
  const purchase = await Purchase.findOne({ stripePaymentIntentId });
  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }
  
  if (purchase.status === 'completed') {
    return purchase; // Ya está completada
  }
  
  // Marcar como completada
  purchase.status = 'completed';
  purchase.completedAt = new Date();
  
  // Actualizar contador de uso del descuento
  if (purchase.discount?.code) {
    await DiscountCode.findOneAndUpdate(
      { code: purchase.discount.code },
      { $inc: { usedCount: 1 } }
    );
  }
  
  await purchase.save();
  
  // Enviar email de confirmación
  try {
    await emailService.emailService.sendPurchaseConfirmation(purchase);
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
  }
  
  return purchase;
}

/**
 * Otorgar acceso administrativo a un curso
 */
export async function grantAdminAccess(adminUserId, targetUserId, courseId) {
  const admin = await User.findById(adminUserId);
  if (!admin.roles.includes('admin')) {
    throw new AppError('Unauthorized', 403);
  }
  
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }
  
  // Verificar si ya tiene acceso
  const existingPurchase = await Purchase.findOne({
    user: targetUserId,
    course: courseId,
    status: 'completed'
  });
  
  if (existingPurchase) {
    throw new AppError('User already has access to this course', 400);
  }
  
  // Crear compra administrativa
  const purchase = new Purchase({
    user: targetUserId,
    course: courseId,
    amountCents: 0,
    currency: course.pricing.currency,
    paymentMethod: 'admin_granted',
    status: 'completed',
    userEmail: targetUser.email,
    courseTitle: course.title,
    completedAt: new Date()
  });
  
  await purchase.save();
  
  return purchase;
}

/**
 * Solicitar reembolso
 */
export async function requestRefund(userId, purchaseId, reason) {
  const purchase = await Purchase.findOne({
    _id: purchaseId,
    user: userId,
    status: 'completed'
  });
  
  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }
  
  // Verificar ventana de reembolso (30 días)
  const daysSincePurchase = (new Date() - purchase.completedAt) / (1000 * 60 * 60 * 24);
  if (daysSincePurchase > 30) {
    throw new AppError('Refund period has expired (30 days)', 400);
  }
  
  if (purchase.refund.status !== 'none') {
    throw new AppError('Refund already requested for this purchase', 400);
  }
  
  purchase.refund.status = 'requested';
  purchase.refund.requestedAt = new Date();
  purchase.refund.reason = reason;
  
  await purchase.save();
  
  return purchase;
}

/**
 * Procesar reembolso (admin)
 */
export async function processRefund(adminUserId, purchaseId, approved, adminNotes = '') {
  const admin = await User.findById(adminUserId);
  if (!admin.roles.includes('admin')) {
    throw new AppError('Unauthorized', 403);
  }
  
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase || purchase.refund.status !== 'requested') {
    throw new AppError('Invalid refund request', 400);
  }
  
  if (approved) {
    // Procesar reembolso en Stripe
    if (purchase.stripePaymentIntentId) {
      const refund = await stripeService.createRefund(purchase.stripePaymentIntentId);
      purchase.refund.stripeRefundId = refund.id;
    }
    
    purchase.refund.status = 'approved';
    purchase.refund.refundedAt = new Date();
    purchase.refund.refundAmountCents = purchase.amountCents;
    purchase.status = 'refunded';
  } else {
    purchase.refund.status = 'rejected';
  }
  
  purchase.refund.adminNotes = adminNotes;
  await purchase.save();
  
  return purchase;
}
