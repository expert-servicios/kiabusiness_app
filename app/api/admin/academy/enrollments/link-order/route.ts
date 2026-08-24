import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { sendEmail } from '@/lib/email/send';
import { academyEnrollmentConfirmed } from '@/lib/email/templates';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

const schema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
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

  // Idempotency: another enrollment might already exist for this payment
  // (e.g. double-click, or the buyer's account got created and this ran twice).
  const { data: existingEnrollment } = await admin
    .from('academy_enrollments')
    .select('id')
    .eq('stripe_payment_id', order.stripe_payment_id)
    .maybeSingle();

  if (!existingEnrollment) {
    const { error: enrollError } = await admin.from('academy_enrollments').insert({
      client_id: matchedProfile.id,
      program_slug: program.slug,
      program_name: program.name,
      amount_eur: order.amount_eur,
      stripe_payment_id: order.stripe_payment_id,
      status: 'active',
    });
    if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 });
  }

  await admin.from('orders').update({ client_id: matchedProfile.id }).eq('id', order.id);

  const tpl = academyEnrollmentConfirmed(matchedProfile.full_name ?? email.split('@')[0], program.name, order.amount_eur);
  await sendEmail({
    to: email,
    eventType: 'academy.enrollment.confirmed',
    ...tpl,
    metadata: { order_id: order.id, program_slug: program.slug, linked_manually: true },
  }).catch((err) => console.error('[admin/academy/link-order] confirmation email failed:', err));

  return NextResponse.json({ ok: true });
}
