import Stripe from 'stripe';

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia'
  });
}
