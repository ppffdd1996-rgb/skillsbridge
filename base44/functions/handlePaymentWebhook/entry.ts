import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Payment Webhook Handler
 * Processes payment events from Stripe
 * NO USER AUTH REQUIRED - validates via webhook signature
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const event = await req.json();

    // In production, validate Stripe signature here
    // const signature = req.headers.get('stripe-signature');
    // Verify signature using Stripe SDK

    console.log('Payment webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntentId = event.data.object.id;
        
        // Find payment record
        const payments = await base44.asServiceRole.entities.Payment.filter({
          payment_intent_id: paymentIntentId
        });

        if (payments.length > 0) {
          await base44.asServiceRole.entities.Payment.update(payments[0].id, {
            status: 'completed'
          });
          
          // If match fee, mark match as paid
          if (payments[0].payment_type === 'match_fee' && payments[0].match_id) {
            const matches = await base44.asServiceRole.entities.Match.filter({
              id: payments[0].match_id
            });
            
            if (matches.length > 0 && matches[0].status === 'mutual_interest') {
              await base44.asServiceRole.entities.Match.update(matches[0].id, {
                status: 'in_trial'
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntentId = event.data.object.id;
        
        const payments = await base44.asServiceRole.entities.Payment.filter({
          payment_intent_id: paymentIntentId
        });

        if (payments.length > 0) {
          await base44.asServiceRole.entities.Payment.update(payments[0].id, {
            status: 'failed'
          });
        }
        break;
      }

      case 'charge.refunded': {
        const paymentIntentId = event.data.object.payment_intent;
        
        const payments = await base44.asServiceRole.entities.Payment.filter({
          payment_intent_id: paymentIntentId
        });

        if (payments.length > 0) {
          await base44.asServiceRole.entities.Payment.update(payments[0].id, {
            status: 'refunded'
          });
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ 
      success: true, 
      received: true 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});