import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Client 360 checkout operations', () => {
  const emailRoute = source('app/api/admin/subscriptions/email/route.ts');
  const generator = source('app/(protected)/admin/suscripciones/generar/page.tsx');
  const subscriptions = source('app/(protected)/admin/suscripciones/page.tsx');

  it('reuses the same hardened checkout loader for safe GET operations', () => {
    expect(emailRoute).toContain('export async function GET(request: NextRequest)');
    expect(emailRoute).toContain('const checkout = await loadCheckout(sessionId)');
    expect(emailRoute).toContain("if (local.status !== 'open')");
    expect(emailRoute).toContain("stripeSession.status !== 'open'");
    expect(emailRoute).toContain('stripeSession.client_reference_id !== local.user_id');
    expect(emailRoute).toContain('stripeSession.metadata?.company_id !== local.company_id');
    expect(emailRoute).toContain(".in('status', ['active', 'trialing'])");
  });

  it('returns only operational checkout state and registered EXPERT delivery metadata', () => {
    expect(emailRoute).toContain('emailSent: checkout.metadata.email_sent === true');
    expect(emailRoute).toContain('emailSentAt:');
    expect(emailRoute).toContain('emailSource:');
    expect(emailRoute).toContain('leadId:');
    expect(emailRoute).toContain('quoteId:');
    expect(emailRoute).toContain('onboardingCaseId:');
  });

  it('offers managing an open checkout instead of creating another one', () => {
    expect(generator).toContain('Gestionar Checkout abierto');
    expect(generator).toContain('loadExistingCheckout(openCheckoutForCompany.stripe_session_id)');
    expect(generator).toContain("fetch(`/api/admin/subscriptions/email?sessionId=${encodeURIComponent(sessionId)}`");
    expect(generator).toContain('!openCheckoutForCompany && !activeForCompany');
    expect(generator).toContain('No se generará otro.');
  });

  it('warns that email_sent=false does not prove the link was never sent externally', () => {
    expect(generator).toContain('EXPERT no puede asumir que no se haya enviado manualmente desde Outlook/Gmail');
    expect(generator).toContain('Confirma antes que el enlace no se haya enviado manualmente desde Outlook/Gmail');
    expect(generator).toContain('Control de duplicados externos');
    expect(generator).toContain('/comunicaciones');
  });

  it('disables an EXPERT resend when the checkout already records an EXPERT delivery', () => {
    expect(generator).toContain('setEmailSent(json.emailSent === true)');
    expect(generator).toContain('disabled={sending || composing || emailSent');
    expect(generator).toContain("emailSent ? 'Correo ya enviado'");
  });

  it('shows checkout attempt history beside subscriptions in contextual Client 360 view', () => {
    expect(subscriptions).toContain('Intentos de Checkout');
    expect(subscriptions).toContain('client360?.checkoutSessions');
    expect(subscriptions).toContain('Email EXPERT:');
    expect(subscriptions).toContain('Gestionar Checkout abierto');
    expect(subscriptions).toContain('Revisar comunicaciones');
    expect(subscriptions).toContain('No se crea, cancela ni modifica ninguna sesión desde esta lista.');
  });

  it('does not add a checkout cancel/delete operation to this management phase', () => {
    expect(subscriptions).not.toContain("method: 'DELETE'");
    expect(generator).not.toContain("method: 'DELETE'");
    expect(emailRoute).not.toContain('checkout.sessions.expire');
  });
});
