import { NextRequest, NextResponse } from 'next/server';
import { getResendClient } from '@/lib/integrations/resend';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const nombre = String(formData.get('nombre') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const telefono = String(formData.get('telefono') ?? '').trim();
    const asunto = String(formData.get('asunto') ?? '').trim();
    const mensaje = String(formData.get('mensaje') ?? '').trim();

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const resend = getResendClient();
    const adminEmail = process.env.ADMIN_EMAILS ?? 'soy@kseniailicheva.com';

    // Notify admin
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@kseniailicheva.com',
      to: adminEmail,
      subject: `Nuevo contacto: ${nombre} — ${asunto || 'Sin área especificada'}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold;width:120px">Nombre</td><td style="padding:8px">${nombre}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
          ${telefono ? `<tr><td style="padding:8px;font-weight:bold">Teléfono</td><td style="padding:8px">${telefono}</td></tr>` : ''}
          ${asunto ? `<tr><td style="padding:8px;font-weight:bold">Área</td><td style="padding:8px">${asunto}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Mensaje</td><td style="padding:8px;white-space:pre-wrap">${mensaje}</td></tr>
        </table>
      `
    });

    // Auto-reply to sender
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@kseniailicheva.com',
      to: email,
      subject: 'Hemos recibido tu mensaje — EXPERT',
      html: `
        <p>Hola ${nombre},</p>
        <p>Gracias por escribirnos. Hemos recibido tu mensaje y te responderemos en menos de 24 horas hábiles.</p>
        ${asunto ? `<p><strong>Área consultada:</strong> ${asunto}</p>` : ''}
        <p>Si tu consulta es urgente, puedes escribirnos directamente por WhatsApp: <a href="https://wa.me/34696550480">+34 696 55 04 80</a></p>
        <br>
        <p>Un saludo,<br><strong>Ksenia Ilicheva — EXPERT</strong><br>soy@kseniailicheva.com</p>
      `
    });

    return NextResponse.redirect(new URL('/gracias/contacto', request.url));
  } catch (error) {
    console.error('[api/contact]', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
  }
}
