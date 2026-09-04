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

  it('fails onboarding completion when persistence fails', () => {
    const route = source('app/api/dashboard/onboarding/complete/route.ts');

    expect(route).toContain('const { error: updateError } = await getSupabaseAdmin()');
    expect(route).toContain('if (updateError)');
    expect(route).toContain("{ status: 500 }");
  });

  it('requires the same profile fields in the wizard and waits for completion persistence', () => {
    const wizard = source('app/(protected)/dashboard/onboarding/page.tsx');

    expect(wizard).toContain('Teléfono *');
    expect(wizard).toContain("if (!profileData.phone.trim())");
    expect(wizard).toContain("const res = await fetch('/api/dashboard/onboarding/complete'");
    expect(wizard).toContain('if (!res.ok)');
    expect(wizard).toContain('Obligatorio para contratar un plan mensual');
  });

  it('uses canonical readiness rules for newly admin-created clients', () => {
    const invite = source('app/api/admin/users/invite/route.ts');

    expect(invite).toContain("import { computeProfileReadiness } from '@/lib/utils/profile-readiness';");
    expect(invite).toContain('const readiness = computeProfileReadiness({');
    expect(invite).toContain('profileData.profile_completed = readiness.profileCompleted');
    expect(invite).toContain('profileData.billing_ready = readiness.billingReady');
    expect(invite).toContain("if (isNewUser) {");
  });

  it('keeps monthly checkout gated by profile, billing, company membership and Holded', () => {
    const checkout = source('app/api/subscriptions/checkout/route.ts');

    expect(checkout).toContain('profile.profile_completed');
    expect(checkout).toContain('profile.billing_ready');
    expect(checkout).toContain(".from('profile_companies')");
    expect(checkout).toContain(".eq('provider', 'holded')");
    expect(checkout).toContain(".eq('company_id', companyId)");
    expect(checkout).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('keeps admin subscription links scoped to the selected entity and Holded integration', () => {
    const sendLink = source('app/api/admin/subscriptions/send-link/route.ts');

    expect(sendLink).toContain("code: 'company_required'");
    expect(sendLink).toContain("code: 'holded_required'");
    expect(sendLink).toContain(".eq('company_id', companyId)");
    expect(sendLink).toContain('company_id: companyId');
    expect(sendLink).toContain('await stripe.checkout.sessions.expire(session.id)');
  });
});
