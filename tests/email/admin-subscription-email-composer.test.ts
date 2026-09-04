import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin subscription email composer', () => {
  const page = source('app/(protected)/admin/suscripciones/generar/page.tsx');
  const route = source('app/api/admin/subscriptions/email/route.ts');
  const template = source('lib/email/subscription-custom-template.ts');

  it('offers editable email copy, KIA improvement and explicit send confirmation', () => {
    expect(page).toContain('Mejorar con KIA');
    expect(page).toContain('Revisar y enviar');
    expect(page).toContain("action: 'compose'");
    expect(page).toContain("action: 'send'");
    expect(page).toContain('window.confirm');
  });

  it('keeps the Stripe checkout URL outside AI-editable content', () => {
    expect(route).toContain('No incluyas URLs, markdown, botones, HTML ni placeholders de enlaces.');
    expect(route).toContain('checkoutUrl: checkout.stripeSession.url!');
    expect(template).toContain('<a href="${checkoutUrl}"');
    expect(page).toContain('KIA tampoco puede modificarlo');
  });

  it('revalidates the open checkout and blocks subscription conflicts before compose or send', () => {
    expect(route).toContain("if (local.status !== 'open')");
    expect(route).toContain(".in('status', ['active', 'trialing'])");
    expect(route).toContain("stripeSession.status !== 'open'");
    expect(route).toContain("stripeSession.client_reference_id !== local.user_id");
    expect(route).toContain("stripeSession.metadata?.company_id !== local.company_id");
  });

  it('uses durable idempotency so the same checkout invitation is sent at most once', () => {
    expect(route).toContain('sendEmailOnce');
    expect(route).toContain('`subscription/invite/${checkout.local.stripe_session_id}`');
    expect(route).toContain("eventType: 'subscription.invite_sent'");
  });

  it('renders a branded HTML email with a real CTA button and tax-exclusive copy', () => {
    expect(template).toContain('<!DOCTYPE html>');
    expect(template).toContain('EXPERT ESTUDIOS PROFESIONALES, SLU');
    expect(template).toContain('/mes + IVA');
    expect(template).toContain('Pago seguro procesado por Stripe');
  });
});
