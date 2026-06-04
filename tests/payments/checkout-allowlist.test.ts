import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Tests para la logica de allowlist de plans de suscripcion.
 *
 * La logica en app/api/subscriptions/checkout/route.ts construye PLAN_CHECKOUTS
 * filtrando env vars vacias. Replicamos esa logica aqui para testear los casos
 * criticos sin necesitar levantar el servidor completo.
 */

function buildAllowlist(env: Record<string, string>): string[] {
  const plans = [
    env.STRIPE_PLAN_MONTHLY_49  ?? '',
    env.STRIPE_PLAN_MONTHLY_99  ?? '',
    env.STRIPE_PLAN_MONTHLY_199 ?? '',
    env.STRIPE_PLAN_ANNUAL_49   ?? '',
    env.STRIPE_PLAN_ANNUAL_99   ?? '',
    env.STRIPE_PLAN_ANNUAL_199  ?? '',
  ];
  return plans.filter(Boolean);
}

function isValidPlan(priceId: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return false; // no plans configured → fail closed
  return allowlist.includes(priceId);
}

describe('checkout subscription allowlist', () => {
  const REAL_ENV = {
    STRIPE_PLAN_MONTHLY_49:  'price_monthly_49',
    STRIPE_PLAN_MONTHLY_99:  'price_monthly_99',
    STRIPE_PLAN_MONTHLY_199: 'price_monthly_199',
    STRIPE_PLAN_ANNUAL_49:   'price_annual_49',
    STRIPE_PLAN_ANNUAL_99:   'price_annual_99',
    STRIPE_PLAN_ANNUAL_199:  'price_annual_199',
  };

  it('acepta priceId en la allowlist', () => {
    const list = buildAllowlist(REAL_ENV);
    expect(isValidPlan('price_monthly_49', list)).toBe(true);
    expect(isValidPlan('price_annual_199', list)).toBe(true);
  });

  it('rechaza priceId arbitrario no configurado', () => {
    const list = buildAllowlist(REAL_ENV);
    expect(isValidPlan('price_attacker_custom', list)).toBe(false);
    expect(isValidPlan('', list)).toBe(false);
    expect(isValidPlan('price_free_tier_hack', list)).toBe(false);
  });

  it('falla cerrado si ningun STRIPE_PLAN_* esta configurado', () => {
    const list = buildAllowlist({});
    expect(isValidPlan('price_anything', list)).toBe(false);
    expect(list.length).toBe(0);
  });

  it('excluye planes con env var vacia', () => {
    const partialEnv = {
      STRIPE_PLAN_MONTHLY_49: 'price_monthly_49',
      STRIPE_PLAN_MONTHLY_99: '', // vacia — debe quedar fuera
    };
    const list = buildAllowlist(partialEnv);
    expect(list).toContain('price_monthly_49');
    expect(list).not.toContain('');
    expect(list.length).toBe(1);
  });

  it('no acepta price IDs de otros ambientes mezclados (live vs test)', () => {
    const liveEnv = { STRIPE_PLAN_MONTHLY_49: 'price_live_abc' };
    const list = buildAllowlist(liveEnv);
    expect(isValidPlan('price_test_abc', list)).toBe(false);
  });
});
