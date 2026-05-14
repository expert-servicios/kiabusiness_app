import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authenticated session
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const stripe = getStripeClient();
    const { id } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kseniailicheva.com';

    const supabaseAdmin = getSupabaseAdmin();
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('amount_eur,title,description,status,client_id')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      console.error('Quote lookup failed:', quoteError);
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Only the quote owner can pay it
    if (quote.client_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Reject already paid or expired quotes
    if (quote.status === 'paid' || quote.status === 'expired') {
      return NextResponse.json({ error: 'Este presupuesto no admite pago en su estado actual' }, { status: 400 });
    }

    const amountEur = Number(quote.amount_eur);
    if (!amountEur || amountEur <= 0) {
      return NextResponse.json(
        { error: 'El presupuesto no tiene un importe válido para pago' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: id,
      metadata: { quote_id: id },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: quote.title,
              description: quote.description
            },
            unit_amount: Math.round(amountEur * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${appUrl}/gracias/pago`,
      cancel_url: `${appUrl}/dashboard/presupuestos`
    });

    await supabaseAdmin.from('quotes').update({ stripe_checkout_id: session.id }).eq('id', id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Quote checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
