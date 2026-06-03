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

export function toStripeAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 499);
}

/**
 * Creates or updates a Stripe customer for an EXPERT profile.
 * Returns the Stripe customer ID, or null if Stripe is not configured.
 */
export async function upsertStripeCustomer(params: {
  profileId: string;
  name: string | null;
  email: string;
  phone?: string | null;
  existingCustomerId?: string | null;
}): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  const stripe = getStripeClient();

  if (params.existingCustomerId) {
    try {
      await stripe.customers.update(params.existingCustomerId, {
        name: params.name ? toStripeAscii(params.name) : undefined,
        phone: params.phone ?? undefined,
        metadata: { expert_profile_id: params.profileId },
      });
      return params.existingCustomerId;
    } catch { /* deleted customer \u2014 fall through to create */ }
  }

  // Check for existing customer by email to avoid duplicates
  const existing = await stripe.customers.list({ email: params.email, limit: 1 });
  if (existing.data.length > 0) {
    const cus = existing.data[0];
    await stripe.customers.update(cus.id, {
      name: params.name ? toStripeAscii(params.name) : (cus.name ?? undefined),
      metadata: { expert_profile_id: params.profileId },
    });
    return cus.id;
  }

  const created = await stripe.customers.create({
    email: params.email,
    name: params.name ? toStripeAscii(params.name) : undefined,
    phone: params.phone ?? undefined,
    metadata: { expert_profile_id: params.profileId },
  });
  return created.id;
}
