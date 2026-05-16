import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { quoteWithPaymentLink } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user.id : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: quote, error } = await admin
      .from('quotes')
      .select('id,title,description,amount_eur,expires_at,client_id,lead_id,status')
      .eq('id', id)
      .single();

    if (error || !quote) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });

    // Resolve recipient email: prefer registered client, fall back to lead
    let recipientEmail: string | null = null;
    let recipientName: string = 'Cliente';

    if (quote.client_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(quote.client_id);
      recipientEmail = authUser?.user?.email ?? null;
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', quote.client_id).single();
      recipientName = profile?.full_name ?? recipientEmail?.split('@')[0] ?? 'Cliente';
    }

    if (!recipientEmail && quote.lead_id) {
      const { data: lead } = await admin.from('leads').select('email,name').eq('id', quote.lead_id).single();
      recipientEmail = lead?.email ?? null;
      recipientName = lead?.name ?? 'Cliente';
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No se encontró email de destino para este presupuesto' }, { status: 422 });
    }

    // Create a new Stripe checkout session
    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es';
    const expiresAt = quote.expires_at ?? new Date(Date.now() + 14 * 86_400_000).toISOString();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: quote.id,
      customer_email: recipientEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(Number(quote.amount_eur) * 100),
            product_data: { name: quote.title, description: quote.description ?? undefined }
          },
          quantity: 1
        }
      ],
      metadata: { quote_id: quote.id, product_type: 'presupuesto' },
      success_url: `${appUrl}/dashboard/expedientes?pago=ok`,
      cancel_url: `${appUrl}/dashboard?pago=cancelado`,
      expires_at: Math.floor(new Date(expiresAt).getTime() / 1000)
    });

    // Update quote with new Stripe session ID
    await admin.from('quotes').update({ stripe_checkout_id: session.id, status: 'sent' }).eq('id', quote.id);

    // Send email with payment link
    const funFact = getRandomFunFact();
    const tpl = quoteWithPaymentLink(recipientName, Number(quote.amount_eur), quote.title, session.url!, expiresAt, funFact);
    await sendEmail({
      to: recipientEmail,
      eventType: 'quote.payment_link_resent',
      ...tpl,
      metadata: { quote_id: quote.id, session_id: session.id }
    });

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'quote.resent',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: { recipient_email: recipientEmail, stripe_session: session.id }
    }).then(() => {});

    return NextResponse.json({ ok: true, stripeUrl: session.url });
  } catch (err) {
    console.error('[admin/quotes/[id]/resend] POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
