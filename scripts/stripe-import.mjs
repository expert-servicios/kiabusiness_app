/**
 * DEPRECATED — DO NOT USE FOR PRODUCTION IMPORTS.
 *
 * Historical note:
 * This script previously read Stripe directly and linked customers to EXPERT
 * profiles by email, then wrote a single profiles.stripe_customer_id. That
 * identity model is no longer valid: one normalized email can correspond to
 * multiple historical Stripe customer IDs.
 *
 * Current architecture:
 *   Stripe -> Supabase Stripe Sync Engine -> private stripe.* mirror
 *          -> controlled reconciliation -> EXPERT operational tables
 *
 * Canonical historical customer identity is preserved through
 * public.lead_stripe_customers (many Stripe customers -> one canonical lead).
 * Marketing consent must never be inferred from Stripe presence or payment.
 *
 * This file intentionally exits non-zero so an old runbook or manual command
 * cannot mutate profiles, orders, subscriptions or leads using the obsolete
 * email-based reconciliation logic.
 */

console.error(
  [
    'scripts/stripe-import.mjs is deprecated and intentionally disabled.',
    'Use the Stripe Sync Engine mirror and the controlled reconciliation flow instead.',
    'Do not restore email-only profile linking or single stripe_customer_id overwrite behavior.',
  ].join('\n'),
);

process.exit(1);
