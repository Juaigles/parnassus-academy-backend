// src/controllers/webhookController.js
import { stripeService } from '../services/stripeService.js';
import * as purchaseService from '../services/purchaseService.js';

/**
 * Webhook de Stripe
 * POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = stripeService.constructWebhookEvent(req.body, signature);
    
    console.log(`🔔 Stripe webhook received: ${event.type}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
        
      default:
        console.log(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Stripe webhook error:', error.message);
    res.status(400).json({
      success: false,
      message: `Webhook Error: ${error.message}`
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
    
    const purchase = await purchaseService.confirmPurchase(paymentIntent.id);
    
    console.log(`🎉 Purchase confirmed: ${purchase.id} - ${purchase.courseTitle}`);
  } catch (error) {
    console.error('Error confirming purchase:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);
    
    const Purchase = (await import('../models/Purchase.js')).default;
    await Purchase.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'failed' }
    );
    
    console.log(`💸 Purchase marked as failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
    
    const Purchase = (await import('../models/Purchase.js')).default;
    await Purchase.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'cancelled' }
    );
    
    console.log(`🚫 Purchase marked as cancelled: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling canceled payment:', error);
  }
}
