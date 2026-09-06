import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const api = source('app/api/admin/leads/route.ts');
const page = source('app/(protected)/admin/leads/page.tsx');
const selector = source('components/admin/LeadLifecycleSelect.tsx');
const requireAdmin = source('lib/auth/require-admin.ts');

describe('EXPERT leads admin dashboard', () => {
  it('uses the shared admin guard, including inactive-profile blocking', () => {
    expect(api).toContain("import { requireAdminClient } from '@/lib/auth/require-admin'");
    expect(api).toContain('await requireAdminClient(request)');
    expect(api).not.toContain('async function requireAdmin(');
    expect(requireAdmin).toContain("profile?.status === 'inactive'");
    expect(requireAdmin).toContain("profile?.role === 'admin' || profile?.role === 'owner'");
  });

  it('exposes controlled CRM filters', () => {
    expect(api).toContain("LIFECYCLE_STAGES = ['lead', 'prospect', 'customer', 'former_customer']");
    expect(api).toContain("STRIPE_ACTIVITIES = ['no_activity', 'abandoned', 'paid', 'subscribed']");
    expect(api).toContain("MARKETING_STATUSES = ['unknown', 'consented', 'unsubscribed', 'blocked']");
  });

  it('fails closed when a CRM metric query errors', () => {
    expect(api).toContain('const statsError = statsResults.find((result) => result.error)?.error');
    expect(api).toContain('if (statsError) throw statsError');
    expect(page).toContain('const loadFailed = data === null');
    expect(page).toContain('Las cifras mostradas no representan el estado real.');
    expect(page).toContain('No se muestran resultados vacíos');
  });

  it('validates lead UUIDs and malformed PATCH bodies before updating', () => {
    expect(api).toContain('UUID_PATTERN');
    expect(api).toContain("return NextResponse.json({ error: 'ID no válido' }, { status: 400 })");
    expect(api).toContain('await request.json().catch(() => null)');
    expect(api).toContain("typeof lifecycleStage !== 'string'");
  });

  it('reads Stripe mappings without changing financial history', () => {
    expect(api).toContain(".from('lead_stripe_customers')");
    expect(api).toContain('customer_count');
    expect(api).toContain('paid_invoices');
    expect(api).not.toContain(".from('orders').update");
    expect(api).not.toContain(".from('subscriptions').update");
  });

  it('only lets the UI patch CRM lifecycle stage', () => {
    expect(selector).toContain('lifecycle_stage');
    expect(selector).toContain('Etapa CRM del contacto');
    expect(selector).not.toContain('marketing_status');
    expect(api).toContain(".update({ lifecycle_stage: lifecycleStage");
    expect(page).toContain('Etapa CRM');
  });

  it('keeps unknown marketing status non-consented without overstating its meaning', () => {
    expect(page).toContain('Consentimiento no acreditado');
    expect(page).toContain('sin consentimiento registrado');
    expect(page).toContain('No habilitado para campañas.');
    expect(page).not.toContain("unknown: 'Sin consentimiento'");
    expect(page).toContain('marketing_status');
  });

  it('exposes the EXPERT contacts route from the admin module itself', () => {
    expect(page).toContain('Contactos y leads');
    expect(page).toContain('href="/admin"');
  });
});
