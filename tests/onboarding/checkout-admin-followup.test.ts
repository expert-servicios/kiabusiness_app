import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Checkout Admin follow-up', () => {
  const migration = source('supabase/migrations/20260905103600_checkout_subscription_admin_followup.sql');

  it('creates one open contracting task per client for subscription checkouts', () => {
    expect(migration).toContain('internal_tasks_one_open_checkout_followup_per_client');
    expect(migration).toContain("title = 'Formalizar contratación de suscripción'");
    expect(migration).toContain("coalesce(new.metadata->>'product_type','') <> 'subscription'");
    expect(migration).toContain("if new.status = 'open' then");
    expect(migration).toContain('on conflict (client_id)');
  });

  it('completes the contracting task when the checkout completes or expires', () => {
    expect(migration).toContain("new.status in ('completed','expired')");
    expect(migration).toContain("set status = 'completada'");
    expect(migration).toContain('completed_at = coalesce(completed_at, v_now)');
  });

  it('links the task to the onboarding case without modifying checkout financial data', () => {
    expect(migration).toContain("new.metadata->>'onboarding_case_id'");
    expect(migration).toContain("c.service = 'Alta de usuario'");
    expect(migration).not.toContain('update public.checkout_sessions');
    expect(migration).not.toContain('delete from public.checkout_sessions');
  });

  it('backfills only currently open subscription checkouts', () => {
    expect(migration).toContain("where cs.status='open'");
    expect(migration).toContain("coalesce(cs.metadata->>'product_type','')='subscription'");
    expect(migration).toContain('cs.user_id is not null');
  });
});
