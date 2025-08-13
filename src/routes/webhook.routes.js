// src/routes/webhook.routes.js
import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

export const webhookRouter = Router();

// Webhook de Stripe (sin auth, ya que viene de Stripe)
webhookRouter.post('/webhooks/stripe', handleStripeWebhook);
