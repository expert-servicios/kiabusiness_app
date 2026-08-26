import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const schema = z.object({ enrollmentId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: enrollment } = await admin
    .from('academy_enrollments')
    .select('id, client_id, program_slug, status, certification_status')
    .eq('id', parsed.data.enrollmentId)
    .maybeSingle();

  if (!enrollment || enrollment.client_id !== user.id) {
    return NextResponse.json({ error: 'Matrícula no encontrada' }, { status: 404 });
  }

  if (enrollment.status === 'cancelled') {
    return NextResponse.json({ error: 'Esta matrícula está cancelada' }, { status: 409 });
  }

  if (enrollment.certification_status !== 'approved') {
    return NextResponse.json({ error: 'Tu certificación todavía no ha sido aprobada por el equipo de EXPERT' }, { status: 409 });
  }

  const program = getAcademyProgram(enrollment.program_slug);
  const certification = program?.officialCertification;
  if (!certification?.stripePriceId) {
    return NextResponse.json({ error: 'Certificación no disponible para pago online' }, { status: 400 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  const stripe = getStripeClient();
  const appUrl = getPublicAppUrl();

  const session = await stripe.checkout.sessions.create(
    {
      mode                       : 'payment',
      automatic_tax              : { enabled: true },
      billing_address_collection : 'required',
      tax_id_collection          : { enabled: true, required: 'if_supported' },
      client_reference_id        : user.id,
      customer                   : profile?.stripe_customer_id ?? undefined,
      customer_email             : profile?.stripe_customer_id ? undefined : user.email,
      line_items                 : [{ price: certification.stripePriceId, quantity: 1 }],
      success_url                : `${appUrl}/dashboard/academy?certification=paid`,
      cancel_url                 : `${appUrl}/dashboard/academy`,
      metadata                   : {
        product_type  : 'academy_certification',
        enrollment_id : enrollment.id,
        program_slug  : enrollment.program_slug,
        program_name  : program?.name ?? '',
        user_id       : user.id,
      },
      locale                     : 'es',
    },
    // Deterministic per enrollment: if the student leaves the Checkout page
    // and clicks "pay" again, Stripe returns the SAME session instead of
    // creating a second payable one — avoids double-charging on retries.
    // Window is Stripe's standard 24h idempotency key lifetime.
    { idempotencyKey: `academy-cert-checkout-${enrollment.id}` }
  );

  return NextResponse.json({ url: session.url });
}
