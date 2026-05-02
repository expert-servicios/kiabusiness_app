import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/integrations/stripe';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error('Stripe webhook verify failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const quoteId = session.client_reference_id ?? session.metadata?.quote_id;

    if (quoteId) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: quote, error: quoteFetchError } = await supabaseAdmin
        .from('quotes')
        .select('client_id')
        .eq('id', quoteId)
        .single();

      if (!quote || quoteFetchError) {
        console.error('Quote not found for webhook:', quoteFetchError);
      } else {
        const { error: quoteUpdateError } = await supabaseAdmin
          .from('quotes')
          .update({ status: 'paid', stripe_checkout_id: session.id })
          .eq('id', quoteId);

        if (quoteUpdateError) {
          console.error('Failed to update quote status:', quoteUpdateError);
        }

        if (quote.client_id) {
          const { error: caseError } = await supabaseAdmin.from('cases').insert({
            quote_id: quoteId,
            client_id: quote.client_id,
            category: 'presupuesto',
            service: 'servicio',
            state: 'pendiente_documentacion'
          });

          if (caseError) {
            console.error('Failed to create case after payment:', caseError);
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
