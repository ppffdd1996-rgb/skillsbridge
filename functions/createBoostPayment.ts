import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boost_type, target_id, duration_days } = await req.json();

    // Pricing: $10 for 7 days, $25 for 30 days
    const pricing = {
      7: 1000,
      30: 2500
    };

    const price = pricing[duration_days];
    if (!price) {
      return Response.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: 'usd',
      metadata: {
        user_email: user.email,
        boost_type,
        target_id,
        duration_days: duration_days.toString()
      }
    });

    // Create boost record
    const boost = await base44.asServiceRole.entities.Boost.create({
      user_email: user.email,
      boost_type,
      target_id,
      duration_days,
      price,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending'
    });

    return Response.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      boost_id: boost.id
    });
  } catch (error) {
    console.error('Error creating boost payment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});