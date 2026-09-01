import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { sendEmail } from '@/lib/email/send';
import { academyEnrollmentConfirmed } from '@/lib/email/templates';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { linkAcademyOrderToClient } from '@/lib/payments/academy-fulfillment';

const schema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }
  const { orderId, email } = parsed.data;

  const { data: order } = await admin
    .from('orders')
    .select('id, client_id, amount_eur, stripe_payment_id, service_slugs')
    .eq('id', orderId)
    .eq('source', 'academy')
    .maybeSingle();

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  if (order.client_id) return NextResponse.json({ error: 'Este pedido ya está vinculado a una cuenta' }, { status: 409 });

  const { data: matchedProfile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle();

  if (!matchedProfile) {
    return NextResponse.json({ error: 'No existe ninguna cuenta EXPERT con ese email todavía.' }, { status: 404 });
  }

  const program = order.service_slugs ? getAcademyProgram(order.service_slugs) : undefined;
  if (!program) return NextResponse.json({ error: 'Programa del pedido no reconocido' }, { status: 400 });

  let linkResult: { enrollmentId: string; created: boolean };
  try {
    linkResult = await linkAcademyOrderToClient(admin, order.id, matchedProfile.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo vincular el pedido';
    const ownershipConflict = /belongs|match|owned|another/i.test(message);
    return NextResponse.json({ error: message }, { status: ownershipConflict ? 409 : 500 });
  }

  // A repeated admin request is successful but must not send a second email.
  if (!linkResult.created) return NextResponse.json({ ok: true, alreadyLinked: true });

  const tpl = academyEnrollmentConfirmed(matchedProfile.full_name ?? email.split('@')[0], program.name, order.amount_eur);
  await sendEmail({
    to: email,
    eventType: 'academy.enrollment.confirmed',
    ...tpl,
    metadata: { order_id: order.id, program_slug: program.slug, linked_manually: true },
  }).catch((err) => console.error('[admin/academy/link-order] confirmation email failed:', err));

  return NextResponse.json({ ok: true });
}
