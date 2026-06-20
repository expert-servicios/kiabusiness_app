import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/send';
import { contactAutoReply, contactMessage } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';

const contactSchema = z.object({
  nombre:          z.string().min(1).max(200),
  email:           z.string().email(),
  telefono:        z.string().max(30).optional().default(''),
  asunto:          z.string().max(300).optional().default(''),
  mensaje:         z.string().min(1).max(5000),
  recaptcha_token: z.string().optional().default(''),
  hp_url:          z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try { rawBody = await request.json(); } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const { nombre, email, telefono, asunto, mensaje, recaptcha_token: recaptchaToken, hp_url } = parsed.data;

    if (hp_url) return NextResponse.json({ ok: true });

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const spam = checkSpam({ name: nombre, email, message: mensaje, subject: asunto || undefined });
    if (spam.isSpam) {
      return NextResponse.json({ ok: true });
    }

    const recaptcha = await verifyRecaptchaToken({ token: recaptchaToken, action: 'contact' });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es';

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

    notifyAdmins({
      title: `✉️ Contacto: ${nombre}`,
      body: asunto ? `${asunto} — ${mensaje.slice(0, 60)}` : mensaje.slice(0, 80),
      url: '/admin',
      tag: `contact-${email}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/contact]', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
  }
}
