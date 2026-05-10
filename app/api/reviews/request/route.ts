import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { getResendClient } from '@/lib/integrations/resend';

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const resend = getResendClient();

  await resend.emails.send({
    from: 'EXPERT <notificaciones@expert.es>',
    to: ['cliente@ejemplo.com'],
    subject: 'Valora tu servicio en EXPERT',
    html: '<p>Gracias por confiar en EXPERT. Comparte tu valoración con este enlace seguro.</p>'
  });

  return NextResponse.json({ ok: true });
}
