import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { quoteWithPaymentLink } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { getPublicAppUrl } from '@/lib/utils/app-url';

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
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
      .select('id,title,description,amount_eur,expires_at,client_id,lead_id,status,company_id,stripe_checkout_id')
      .eq('id', id)
      .single();

    if (error || !quote) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });

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

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const expiresAt = quote.expires_at ?? new Date(Date.now() + 14 * 86_400_000).toISOString();
    const previousSessionId = quote.stripe_checkout_id ?? null;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: quote.id,
      customer_email: recipientEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(Number(quote.amount_eur) * 100),
            product_data: {
              name: toStripeAscii(quote.title),
              description: quote.description ? toStripeAscii(quote.description) : undefined
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        quote_id: quote.id,
        product_type: 'presupuesto',
        ...(quote.company_id ? { company_id: quote.company_id } : {})
      },
      success_url: `${appUrl}/dashboard/expedientes?pago=ok`,
      cancel_url: `${appUrl}/dashboard?pago=cancelado`,
      expires_at: Math.floor(new Date(expiresAt).getTime() / 1000)
    });

    const { error: updateError } = await admin
      .from('quotes')
      .update({ stripe_checkout_id: session.id, status: 'sent' })
      .eq('id', quote.id);

    if (updateError) {
      try { await stripe.checkout.sessions.expire(session.id); } catch {}
      return NextResponse.json({ error: 'No se pudo registrar de forma segura el nuevo enlace de pago' }, { status: 500 });
    }

    const funFact = getRandomFunFact();
    const tpl = quoteWithPaymentLink(recipientName, Number(quote.amount_eur), quote.title, session.url!, expiresAt, funFact);

    try {
      await sendEmail({
        to: recipientEmail,
        eventType: 'quote.payment_link_resent',
        ...tpl,
        metadata: { quote_id: quote.id, company_id: quote.company_id ?? null, session_id: session.id }
      });
    } catch (emailError) {
      console.error('[admin/quotes/[id]/resend] email failed:', emailError);
      let expireFailed = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        expireFailed = true;
        console.error('[admin/quotes/[id]/resend] failed to expire new session:', expireError);
      }

      const { error: rollbackError } = await admin
        .from('quotes')
        .update({ stripe_checkout_id: previousSessionId, status: quote.status })
        .eq('id', quote.id)
        .eq('stripe_checkout_id', session.id);

      if (rollbackError) {
        console.error('[admin/quotes/[id]/resend] failed to restore previous session reference:', rollbackError);
      }

      return NextResponse.json({
        error: expireFailed
          ? 'El email falló y no se pudo invalidar el nuevo enlace. Revisa Stripe antes de volver a reenviar.'
          : 'El email no pudo enviarse. El nuevo enlace fue invalidado y se conserva el enlace anterior.',
        code: expireFailed ? 'email_failed_manual_review' : 'email_failed_previous_link_kept'
      }, { status: 502 });
    }

    if (previousSessionId && previousSessionId !== session.id) {
      try {
        const previousSession = await stripe.checkout.sessions.retrieve(previousSessionId);
        if (previousSession.status === 'open') {
          await stripe.checkout.sessions.expire(previousSessionId);
        }
      } catch (expirePreviousError) {
        console.error('[admin/quotes/[id]/resend] previous session could not be expired:', expirePreviousError);
        return NextResponse.json({
          error: 'El nuevo correo se envió, pero el enlace anterior no pudo invalidarse automáticamente. Revisa Stripe para evitar dos enlaces válidos.',
          code: 'previous_link_manual_review',
          stripeUrl: session.url
        }, { status: 409 });
      }
    }

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'quote.resent',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: {
        recipient_email: recipientEmail,
        company_id: quote.company_id ?? null,
        stripe_session: session.id,
        previous_stripe_session: previousSessionId
      }
    }).then(() => {});

    return NextResponse.json({ ok: true, stripeUrl: session.url });
  } catch (err) {
    console.error('[admin/quotes/[id]/resend] POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}