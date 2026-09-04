import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('subscription checkout flow', () => {
  const cards = source('components/subscriptions/SubscriptionPlanCards.tsx');
  const checkout = source('app/api/subscriptions/checkout/route.ts');
  const adminCheckout = source('app/api/admin/subscriptions/send-link/route.ts');
  const postPurchase = source('app/(protected)/dashboard/post-compra/page.tsx');
  const publicPlans = source('app/(public)/planes/page.tsx');

  it('sends standard monthly plan CTAs directly to the subscription checkout endpoint', () => {
    expect(cards).toContain("fetch('/api/subscriptions/checkout'");
    expect(cards).toContain("'Contratar plan'");
    expect(cards).not.toContain('ReadinessModal');
    expect(cards).not.toContain('getReadinessCheck');
  });

  it('keeps authoritative pre-payment prerequisites on the server without requiring Holded', () => {
    expect(checkout).toContain("code: 'profile_required'");
    expect(checkout).toContain("code: 'billing_required'");
    expect(checkout).toContain("code: 'company_required'");
    expect(checkout).not.toContain("code: 'holded_required'");
    expect(checkout).toContain("mode: 'subscription'");
  });

  it('treats advertised plan prices as tax-exclusive amounts in customer and admin checkouts', () => {
    for (const route of [checkout, adminCheckout]) {
      expect(route).toContain("billing_address_collection: 'required'");
      expect(route).toContain("tax_id_collection: { enabled: true, required: 'if_supported' }");
      expect(route).toContain("automatic_tax: { enabled: true }");
      expect(route).toContain("tax_behavior: 'exclusive'");
    }
  });

  it('allows staff to generate one persisted checkout without automatically sending email', () => {
    expect(adminCheckout).toContain("sendEmail: z.boolean().optional().default(true)");
    expect(adminCheckout).toContain('if (!shouldSendEmail)');
    expect(adminCheckout).toContain("action: 'subscription.checkout_generated'");
    expect(adminCheckout).toContain('emailSent: false');
    expect(adminCheckout).toContain("code: 'subscription_exists'");
    expect(adminCheckout).toContain("code: 'checkout_exists'");
  });

  it('locks admin subscription amounts to the configured fixed plan tariff', () => {
    expect(adminCheckout).toContain('PLAN_AMOUNT_ALLOWLIST');
    expect(adminCheckout).toContain('STRIPE_PLAN_MONTHLY_99: 99');
    expect(adminCheckout).toContain("code: 'plan_amount_mismatch'");
    expect(adminCheckout).toContain('unit_amount: Math.round(expectedAmountEur * 100)');
  });

  it('only enters post-purchase onboarding after Stripe has created an active or trialing subscription', () => {
    expect(checkout).toContain("success_url: `${appUrl}/dashboard/post-compra?origin=subscription`");
    expect(postPurchase).toContain("s.status === 'active' || s.status === 'trialing'");
    expect(postPurchase).toContain('!s.post_purchase_onboarding_at');
    expect(postPurchase).toContain('subscriptionId={pendingSub!.id}');
  });

  it('keeps public plan copy aligned with the post-purchase Holded flow', () => {
    expect(publicPlans).toContain('no necesitas tenerlo conectado antes de pagar');
    expect(publicPlans).toContain('después reservas la reunión de onboarding y conectas Holded');
    expect(publicPlans).not.toContain('Holded conectado desde el Panel Cliente antes de contratar');
    expect(publicPlans).not.toContain('Todos los planes pasan por readiness antes de contratar');
    expect(publicPlans).not.toContain('El checkout mensual se bloquea si no tienes perfil completo, datos fiscales listos y Holded conectado');
  });
});