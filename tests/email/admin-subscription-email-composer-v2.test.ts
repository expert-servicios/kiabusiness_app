import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin subscription email composer v2', () => {
  const page = source('app/(protected)/admin/suscripciones/generar/page.tsx');
  const route = source('app/api/admin/subscriptions/email/route.ts');
  const template = source('lib/email/subscription-custom-template.ts');

  it('offers editable copy, KIA improvement, preview and explicit send', () => {
    expect(page).toContain('Mejorar con KIA');
    expect(page).toContain('Revisar y enviar');
    expect(page).toContain("action: 'compose'");
    expect(page).toContain("action: 'send'");
    expect(page).toContain('window.confirm');
    expect(page).toContain('Vista previa');
  });

  it('resolves the canonical recipient from Supabase Auth with profile fallback', () => {
    expect(route).toContain('admin.auth.admin.getUserById(local.user_id)');
    expect(route).toContain('authUserResult.data.user?.email ?? profile?.email ?? null');
    expect(route).toContain('No se pudo resolver el email canónico del cliente');
  });

  it('keeps the Stripe checkout URL outside AI-editable content', () => {
    expect(route).toContain('No incluyas URLs, markdown, botones, HTML ni placeholders de enlaces.');
    expect(route).toContain('checkoutUrl: checkout.stripeSession.url!');
    expect(template).toContain('<a href="${checkoutUrl}"');
    expect(page).toContain('KIA tampoco puede modificarlo');
  });

  it('revalidates checkout, client, company and active subscription before compose or send', () => {
    expect(route).toContain("if (local.status !== 'open')");
    expect(route).toContain(".in('status', ['active', 'trialing'])");
    expect(route).toContain("stripeSession.status !== 'open'");
    expect(route).toContain("stripeSession.client_reference_id !== local.user_id");
    expect(route).toContain("stripeSession.metadata?.company_id !== local.company_id");
  });

  it('uses durable idempotency and preserves commercial trace metadata', () => {
    expect(route).toContain('sendEmailOnce');
    expect(route).toContain('`subscription/invite/${checkout.local.stripe_session_id}`');
    expect(route).toContain('lead_id: checkout.metadata.lead_id ?? null');
    expect(route).toContain('quote_id: checkout.metadata.quote_id ?? null');
    expect(route).toContain('case_id: checkout.metadata.onboarding_case_id ?? null');
  });

  it('marks the linked quote as sent and stores the final HTML for Client 360', () => {
    expect(route).toContain("checkout.admin.from('quotes').update({ status: 'sent' })");
    expect(route).toContain("checkout.admin.from('email_events')");
    expect(route).toContain('update({ html: tpl.html');
    expect(route).toContain('email_sent: true');
    expect(route).toContain("email_source: 'admin_subscription_composer_v2'");
  });

  it('renders a branded HTML email with a protected CTA and tax-exclusive copy', () => {
    expect(template).toContain('<!DOCTYPE html>');
    expect(template).toContain('EXPERT ESTUDIOS PROFESIONALES, SLU');
    expect(template).toContain('/mes + IVA');
    expect(template).toContain('Pago seguro procesado por Stripe');
  });
});
