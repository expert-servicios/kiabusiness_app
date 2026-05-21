import Stripe from 'stripe';

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  return new Stripe(secretKey, {
    // Use stable v1 API — dahlia (v2) restructures checkout params and breaks customer_creation / phone_number_collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2024-06-20' as any,
  });
}
