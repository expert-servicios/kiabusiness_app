import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { contactMessage, contactAutoReply } from '@/lib/email/templates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !token) return !secret; // skip if not configured
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });
    const data = await res.json();
    return data.success === true && (data.score ?? 1) >= 0.5;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot
    if (body.hp_url) return NextResponse.json({ ok: true });

    const nombre = String(body.nombre ?? '').trim();
    const email = String(body.email ?? '').trim();
    const telefono = String(body.telefono ?? '').trim();
    const asunto = String(body.asunto ?? '').trim();
    const mensaje = String(body.mensaje ?? '').trim();
    const recaptcha_token = String(body.recaptcha_token ?? '');

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const valid = await verifyRecaptcha(recaptcha_token);
    if (!valid) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/contact]', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
  }
}
