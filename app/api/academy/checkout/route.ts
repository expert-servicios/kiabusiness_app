import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const checkoutSchema = z.object({
  programSlug: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Login obligatorio antes de pago — mismo criterio que /api/services/checkout.
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para continuar.', requiresAuth: true }, { status: 401 });
    }

    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id,stripe_customer_id,profile_completed')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'Completa tu perfil antes de matricularte.',
        code: 'profile_required',
        profileRequired: true,
      }, { status: 409 });
    }

    if (!profile.profile_completed) {
      return NextResponse.json({
        error: 'Completa nombre y teléfono antes de matricularte.',
        code: 'profile_required',
        profileRequired: true,
      }, { status: 409 });
    }

    const parseResult = checkoutSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de checkout no válidos.' }, { status: 400 });
    }

    const program = getAcademyProgram(parseResult.data.programSlug);
    if (!program || !program.stripePriceId) {
      return NextResponse.json({ error: 'Programa no disponible para matrícula online.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode                       : 'payment',
        automatic_tax              : { enabled: true },
        billing_address_collection : 'required',
        tax_id_collection          : { enabled: true, required: 'if_supported' },
        client_reference_id        : user.id,
        customer                   : profile.stripe_customer_id ?? undefined,
        customer_email             : profile.stripe_customer_id ? undefined : user.email,
        ...(profile.stripe_customer_id ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
        line_items                 : [{ price: program.stripePriceId, quantity: 1 }],
        success_url                : `${appUrl}/gracias/pago?source=academy&service=${program.slug}`,
        cancel_url                 : `${appUrl}/academy`,
        metadata                   : {
          product_type : 'academy_program',
          program_slug : program.slug,
          program_name : program.name,
          user_id      : user.id,
        },
        locale                     : 'es',
      },
      // Deterministic per user + program: a double-click or client retry within
      // Stripe's 24h idempotency window reuses the same Checkout Session
      // instead of creating a second one for the same purchase attempt.
      { idempotencyKey: `academy-checkout-${user.id}-${program.slug}` }
    );

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const e = err as { type?: string; code?: string; message?: string; statusCode?: number; raw?: unknown };
    console.error('[academy/checkout] error:', {
      type: e.type, code: e.code, message: e.message, statusCode: e.statusCode, raw: e.raw,
    });

    const msg     = e.message ?? '';
    const userMsg = msg.includes('No such price')
      ? 'Producto no encontrado en Stripe. Contacta con soporte.'
      : 'Error al iniciar el pago.';
    return NextResponse.json({ error: userMsg, _detail: msg }, { status: 500 });
  }
}
