import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('end-to-end onboarding safeguards', () => {
  it('repairs the missing onboarding completion column without historical DML', () => {
    const migration = source('supabase/migrations/20260904092000_repair_profiles_onboarding_at.sql');
    const sql = migration.replace(/^\s*--.*$/gm, '');
    expect(migration).toContain('add column if not exists onboarding_completed_at timestamptz');
    expect(migration).toContain('create index if not exists profiles_onboarding_pending_idx');
    expect(sql).not.toMatch(/\b(insert|update|delete)\b/i);
  });

  it('fails initial onboarding completion when persistence fails', () => {
    const route = source('app/api/dashboard/onboarding/complete/route.ts');
    expect(route).toContain('const { error: updateError } = await getSupabaseAdmin()');
    expect(route).toContain('if (updateError)');
    expect(route).toContain("{ status: 500 }");
  });

  it('requires profile fields before contracting and keeps Holded out of initial onboarding', () => {
    const wizard = source('app/(protected)/dashboard/onboarding/page.tsx');
    expect(wizard).toContain('Teléfono *');
    expect(wizard).toContain("if (!profileData.phone.trim())");
    expect(wizard).toContain("const res = await fetch('/api/dashboard/onboarding/complete'");
    expect(wizard).toContain('después del pago te guiaremos para reservar el onboarding y conectar Holded');
    expect(wizard).not.toContain("type Step = 'profile' | 'company' | 'holded'");
    expect(wizard).not.toContain('Obligatorio para contratar un plan mensual');
  });

  it('uses canonical readiness rules for newly admin-created clients', () => {
    const invite = source('app/api/admin/users/invite/route.ts');
    expect(invite).toContain("import { computeProfileReadiness } from '@/lib/utils/profile-readiness';");
    expect(invite).toContain('const readiness = computeProfileReadiness({');
    expect(invite).toContain('profileData.profile_completed = readiness.profileCompleted');
    expect(invite).toContain('profileData.billing_ready = readiness.billingReady');
    expect(invite).toContain("if (isNewUser) {");
  });

  it('keeps monthly checkout gated by profile, company billing and membership, not Holded', () => {
    const checkout = source('app/api/subscriptions/checkout/route.ts');
    expect(checkout).toContain('profile.profile_completed');
    expect(checkout).toContain('isCompanyBillingReady(company)');
    expect(checkout).toContain(".from('profile_companies')");
    expect(checkout).not.toContain('profile.billing_ready');
    expect(checkout).not.toContain("code: 'holded_required'");
    expect(checkout).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('keeps admin subscription links scoped to the selected entity without pre-payment Holded gate', () => {
    const sendLink = source('app/api/admin/subscriptions/send-link/route.ts');
    expect(sendLink).toContain("code: 'company_required'");
    expect(sendLink).not.toContain("code: 'holded_required'");
    expect(sendLink).toContain('company_id: companyId');
    expect(sendLink).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('reserves final onboarding closure for Admin after the meeting and Holded validation', () => {
    const clientComplete = source('app/api/dashboard/post-compra/complete/route.ts');
    const adminComplete = source('app/api/admin/clientes/[id]/complete-onboarding/route.ts');
    const wizard = source('components/dashboard/PostCompraWizard.tsx');

    expect(clientComplete).toContain("code: 'admin_completion_required'");
    expect(clientComplete).toContain('{ status: 403 }');
    expect(adminComplete).toContain("code: 'onboarding_meeting_not_completed'");
    expect(adminComplete).toContain("code: 'holded_required'");
    expect(adminComplete).toContain(".eq('id', parsed.data.subscriptionId)");
    expect(adminComplete).toContain(".eq('client_id', clientId)");
    expect(adminComplete).toContain("eventType: 'onboarding.completed.client'");
    expect(adminComplete).toContain("eventType: 'onboarding.review_request'");
    expect(wizard).not.toContain("fetch('/api/dashboard/post-compra/complete'");
    expect(wizard).toContain('Espacio de Cliente Responsable EXPERT');
  });
});
