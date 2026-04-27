import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/integrations/stripe';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const stripe = getStripeClient();
  const { id } = await params;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `Presupuesto ${id}` },
        unit_amount: 10000
      },
      quantity: 1
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gracias/pago`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/presupuestos`
  });

  return NextResponse.json({ url: session.url });
}
