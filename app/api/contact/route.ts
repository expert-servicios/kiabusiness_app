import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { contactMessage, contactAutoReply } from '@/lib/email/templates';

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // skip if not configured
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token })
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Honeypot: bots fill this, humans don't
    if (formData.get('hp_url')) {
      return NextResponse.redirect(new URL('/gracias/contacto', request.url));
    }

    const nombre = String(formData.get('nombre') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const telefono = String(formData.get('telefono') ?? '').trim();
    const asunto = String(formData.get('asunto') ?? '').trim();
    const mensaje = String(formData.get('mensaje') ?? '').trim();
    const turnstileToken = String(formData.get('cf-turnstile-response') ?? '');

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    // Cloudflare Turnstile verification (only when site key is configured)
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const valid = await verifyTurnstile(turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: 'Verificación anti-spam fallida. Recarga la página.' }, { status: 400 });
      }
    }

    const adminEmail = process.env.ADMIN_EMAILS ?? 'soy@kseniailicheva.com';

    await Promise.all([
      sendEmail({
        to: adminEmail,
        eventType: 'contact.received',
        ...contactMessage(nombre, email, asunto, mensaje, telefono || undefined)
      }),
      sendEmail({
        to: email,
        eventType: 'contact.autoreply',
        ...contactAutoReply(nombre, asunto)
      })
    ]);

    return NextResponse.redirect(new URL('/gracias/contacto', request.url));
  } catch (error) {
    console.error('[api/contact]', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
  }
}
