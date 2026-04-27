import { NextResponse } from 'next/server';
import { getResendClient } from '@/lib/integrations/resend';

export async function POST() {
  const resend = getResendClient();

  await resend.emails.send({
    from: 'EXPERT <notificaciones@expert.es>',
    to: ['cliente@ejemplo.com'],
    subject: 'Valora tu servicio en EXPERT',
    html: '<p>Gracias por confiar en EXPERT. Comparte tu valoración con este enlace seguro.</p>'
  });

  return NextResponse.json({ ok: true });
}
