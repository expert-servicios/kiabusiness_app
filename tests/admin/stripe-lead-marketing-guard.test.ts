import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Stripe lead marketing safeguards', () => {
  it('requires explicit consent when resolving lead campaign recipients', () => {
    const segments = source('lib/campaigns/segments.ts');

    expect(segments).toContain(".eq('marketing_status', 'consented')");
    expect(segments).toContain("leads:           'Leads con consentimiento'");
  });

  it('guards campaign_sends at database level', () => {
    const migration = source(
      'supabase/migrations/20260906193117_guard_lead_campaign_marketing_consent.sql',
    );

    expect(migration).toContain("l.marketing_status = 'consented'");
    expect(migration).toContain('campaign_sends_guard_lead_marketing');
    expect(migration).toContain('before insert or update of recipient_email, campaign_id');
  });

  it('preserves multiple Stripe customers per canonical lead', () => {
    const migration = source(
      'supabase/migrations/20260906193102_add_stripe_lead_marketing_model.sql',
    );

    expect(migration).toContain('create table public.lead_stripe_customers');
    expect(migration).toContain('unique (tenant_id, stripe_customer_id)');
    expect(migration).not.toContain('unique (lead_id)');
  });

  it('keeps the obsolete direct Stripe importer disabled', () => {
    const importer = source('scripts/stripe-import.mjs');

    expect(importer).toContain('deprecated and intentionally disabled');
    expect(importer).toContain('process.exit(1)');
    expect(importer).not.toContain("profiles').update({ stripe_customer_id");
  });
});
