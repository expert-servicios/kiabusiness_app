import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const serviceCheckout = fs.readFileSync(path.join(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');
const adminQuote = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');
const adminOnboarding = fs.readFileSync(path.join(process.cwd(), 'app/(protected)/admin/onboarding/page.tsx'), 'utf8');
const quoteModal = fs.readFileSync(path.join(process.cwd(), 'components/admin/NuevaCotizacionModal.tsx'), 'utf8');
const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260904104500_entity_scope_one_time_orders.sql'), 'utf8');

describe('entity-scoped one-time checkout', () => {
  it('persists user + company checkout context and compensates failed persistence', () => {
    expect(serviceCheckout).toContain("from('checkout_sessions').insert");
    expect(serviceCheckout).toContain('company_id: companyId');
    expect(serviceCheckout).toContain('user_id: user.id');
    expect(serviceCheckout).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('admin quote does not silently inherit a client dashboard selection', () => {
    expect(adminQuote).not.toContain('clientProfile.active_company_id');
    expect(adminQuote).toContain("let companyId = parsed.data.companyId ?? null");
    expect(adminQuote).toContain('El cliente tiene varias entidades. Selecciona cuál contrata el servicio.');
  });

  it('admin onboarding and generic quote modal both send explicit companyId', () => {
    expect(adminOnboarding).toContain('companyId: createdCompanyId || undefined');
    expect(quoteModal).toContain('companyId: selectedCompanyId');
    expect(quoteModal).toContain('Entidad contratante *');
  });

  it('future orders inherit company from the persisted Stripe session without historical backfill', () => {
    expect(migration).toContain('before insert on public.orders');
    expect(migration).toContain("new.metadata -> 'checkout_session' ->> 'id'");
    expect(migration).toContain('new.company_id := v_company_id');
    expect(migration).not.toMatch(/update\s+public\.orders/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.orders/i);
  });
});
