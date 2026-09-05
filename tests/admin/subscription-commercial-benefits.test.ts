import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const api = read('app/api/admin/clientes/[id]/subscription-benefits/route.ts');
const page = read('app/(protected)/admin/clientes/[id]/beneficios/page.tsx');
const nav = read('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');
const migration = read('supabase/migrations/20260905122000_subscription_commercial_benefits.sql');

describe('subscription commercial benefits', () => {
  it('reuses subscription_entitlements and never creates a zero-value Stripe subscription', () => {
    expect(api).toContain(".from('subscription_entitlements')");
    expect(api).toContain("sourceType: z.enum(['subscription', 'checkout'])");
    expect(api).toContain("benefitType: z.enum(BENEFIT_TYPES)");
    expect(api).not.toContain('stripe.subscriptions.create');
    expect(api).not.toContain('amountEur: 0');
    expect(page).toContain('no crea una segunda suscripción ni factura a 0 €');
  });

  it('requires both commercial entities to belong to the same client', () => {
    expect(api).toContain(".from('profile_companies')");
    expect(api).toContain(".eq('profile_id', clientId)");
    expect(api).toContain('La entidad contratante y la beneficiaria deben pertenecer al cliente');
    expect(api).toContain('La entidad incluida debe ser distinta de la entidad contratante');
  });

  it('allows benefits only on a valid subscription or an open checkout', () => {
    expect(api).toContain("['active', 'trialing', 'past_due'].includes(source.status)");
    expect(api).toContain("source.status !== 'open'");
    expect(api).toContain('La suscripción no corresponde a este cliente y entidad');
    expect(api).toContain('El Checkout no corresponde a este cliente y entidad');
  });

  it('keeps internal commercial reasons in audit logs instead of client-readable entitlement metadata', () => {
    expect(api).toContain("action: 'subscription.benefit.created'");
    expect(api).toContain("entity: 'subscription_entitlements'");
    expect(api).toContain('reason: input.reason');
    expect(api).toContain('notes: input.notes ?? null');
    expect(api).toContain('metadata: {},');
  });

  it('supports the included-entity case with annual IRPF excluded by default', () => {
    expect(page).toContain("['annual_irpf']");
    expect(page).toContain('Excluir declaración anual IRPF');
    expect(page).toContain('la Renta anual se contrata aparte');
    expect(api).toContain("['annual_irpf']");
    expect(api).toContain("'recurring_management'");
  });

  it('links a pending Checkout benefit only to the matching newly persisted subscription', () => {
    expect(migration).toContain('link_pending_subscription_commercial_benefits');
    expect(migration).toContain('e.client_id = new.client_id');
    expect(migration).toContain('e.primary_company_id = new.company_id');
    expect(migration).toContain("cs.status in ('completed','complete')");
    expect(migration).toContain("abs(extract(epoch from (new.updated_at - cs.updated_at))) <= 900");
    expect(migration).toContain('set subscription_id = new.id');
    expect(migration).toContain('security invoker');
  });

  it('adds only forward-looking schema and no historical financial mutation', () => {
    expect(migration).toContain('alter table public.subscription_entitlements');
    expect(migration).toContain('beneficiary_company_id uuid references public.companies');
    expect(migration).toContain('checkout_session_id uuid references public.checkout_sessions');
    expect(migration).toContain('subscription_entitlements_one_active_commercial_benefit');
    expect(migration).not.toContain('delete from');
    expect(migration).not.toContain('update public.orders');
    expect(migration).not.toContain('update public.subscriptions');
  });

  it('is accessible directly from Client 360 navigation', () => {
    expect(nav).toContain('/beneficios`');
    expect(nav).toContain('Beneficios');
  });
});
