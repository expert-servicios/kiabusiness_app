import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const api = source('app/api/admin/leads/route.ts');
const page = source('app/(protected)/admin/leads/page.tsx');
const selector = source('components/admin/LeadLifecycleSelect.tsx');
const sidebar = source('components/admin/AdminSidebar.tsx');

describe('EXPERT leads admin dashboard', () => {
  it('requires admin access and exposes controlled CRM filters', () => {
    expect(api).toContain("profile?.role !== 'admin' && profile?.role !== 'owner'");
    expect(api).toContain("LIFECYCLE_STAGES = ['lead', 'prospect', 'customer', 'former_customer']");
    expect(api).toContain("STRIPE_ACTIVITIES = ['no_activity', 'abandoned', 'paid', 'subscribed']");
    expect(api).toContain("MARKETING_STATUSES = ['unknown', 'consented', 'unsubscribed', 'blocked']");
  });

  it('reads Stripe mappings without changing financial history', () => {
    expect(api).toContain(".from('lead_stripe_customers')");
    expect(api).toContain('customer_count');
    expect(api).toContain('paid_invoices');
    expect(api).not.toContain(".from('orders').update");
    expect(api).not.toContain(".from('subscriptions').update");
  });

  it('only lets the UI patch lifecycle stage', () => {
    expect(selector).toContain('lifecycle_stage');
    expect(selector).not.toContain('marketing_status');
    expect(api).toContain(".update({ lifecycle_stage: lifecycleStage");
  });

  it('keeps marketing consent informational in the dashboard', () => {
    expect(page).toContain('No habilitado para campañas.');
    expect(page).toContain('Sin consentimiento');
    expect(page).toContain('marketing_status');
  });

  it('adds the EXPERT contacts module to admin navigation', () => {
    expect(sidebar).toContain('{ label: "Contactos EXPERT", href: "/admin/leads" }');
  });
});
