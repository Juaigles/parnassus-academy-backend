// src/services/stripeService.js
import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export const stripeService = {
  /**
   * Crear PaymentIntent
   */
  async createPaymentIntent({ amount, currency = 'eur', metadata = {} }) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return await stripe.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  },

  /**
   * Confirmar PaymentIntent
   */
  async confirmPaymentIntent(paymentIntentId) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return await stripe.paymentIntents.confirm(paymentIntentId);
  },

  /**
   * Obtener PaymentIntent
   */
  async getPaymentIntent(paymentIntentId) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  },

  /**
   * Crear reembolso
   */
  async createRefund(paymentIntentId, amount = null) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    const refundData = { payment_intent: paymentIntentId };
    if (amount) {
      refundData.amount = amount;
    }
    return await stripe.refunds.create(refundData);
  },

  /**
   * Construir evento de webhook
   */
  constructWebhookEvent(payload, signature) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  },

  /**
   * Crear cliente de Stripe
   */
  async createCustomer({ email, name, metadata = {} }) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return await stripe.customers.create({
      email,
      name,
      metadata
    });
  },

  /**
   * Obtener métodos de pago del cliente
   */
  async getCustomerPaymentMethods(customerId) {
    if (!stripe) {
      throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }
};
