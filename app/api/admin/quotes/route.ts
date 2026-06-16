import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { quoteWithPaymentLink } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { generateContractHtml, contractToBuffer } from '@/lib/utils/contract';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { syncQuoteAsEstimate } from '@/lib/integrations/holded';

const quoteSchema = z.object({
  clientEmail: z.string().email('Email de cliente inválido'),
  title: z.string().min(3, 'Título demasiado corto'),
  description: z.string().min(5, 'Descripción demasiado corta'),
  amountEur: z.number().positive('El importe debe ser positivo'),
  expiresInDays: z.number().int().min(1).max(90).default(14),
  docsChecklist: z.array(z.string()).default([])
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { clientEmail, title, description, amountEur, expiresInDays, docsChecklist } = parsed.data;
    const adminSupabase = getSupabaseAdmin();

    // Resolve clientId from email
    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email === clientEmail);
    if (!authUser) {
      return NextResponse.json({ error: 'No existe ningún usuario con ese email. Crea el usuario primero.' }, { status: 404 });
    }
    const clientId = authUser.id;

    const { data: clientProfile } = await adminSupabase
      .from('profiles')
      .select('full_name,company,tax_id,address,city,postal_code')
      .eq('id', clientId)
      .single();

    const clientName = clientProfile?.full_name ?? clientEmail.split('@')[0];

    // 1. Create lead (required FK for quotes)
    const { data: lead, error: leadErr } = await adminSupabase
      .from('leads')
      .insert({
        name: clientName,
        email: clientEmail,
        client_type: 'empresa',
        category: 'presupuesto',
        service: title,
        state: 'converted'
      })
      .select('id')
      .single();

    if (leadErr || !lead) {
      console.error('[admin/quotes] lead insert error:', leadErr);
      return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();

    // 2. Create quote (without Stripe ID yet)
    const { data: quote, error: quoteErr } = await adminSupabase
      .from('quotes')
      .insert({
        lead_id: lead.id,
        client_id: clientId,
        title,
        description,
        amount_eur: amountEur,
        status: 'sent',
        expires_at: expiresAt,
        created_by: actorId,
        docs_checklist: docsChecklist
      })
      .select('id')
      .single();

    if (quoteErr || !quote) {
      console.error('[admin/quotes] quote insert error:', quoteErr);
      return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
    }

    // 3. Generate Stripe checkout session
    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: quote.id,
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(amountEur * 100),
            product_data: { name: toStripeAscii(title), description: toStripeAscii(description) }
          },
          quantity: 1
        }
      ],
      metadata: { quote_id: quote.id, product_type: 'presupuesto' },
      success_url: `${appUrl}/dashboard/expedientes?pago=ok`,
      cancel_url: `${appUrl}/dashboard?pago=cancelado`,
      expires_at: Math.floor(Date.now() / 1000) + expiresInDays * 86400
    });

    // 4. Update quote with Stripe checkout ID
    await adminSupabase
      .from('quotes')
      .update({ stripe_checkout_id: session.id })
      .eq('id', quote.id);

    // 5. Generate contract HTML and base64
    const contractDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail,
      clientCompany: clientProfile?.company ?? null,
      clientTaxId: clientProfile?.tax_id ?? null,
      clientAddress: clientProfile?.city
        ? `${clientProfile.address ?? ''}, ${clientProfile.city}`.trim().replace(/^,\s*/, '')
        : clientProfile?.address ?? null,
      serviceTitle: title,
      serviceDescription: description,
      amountEur,
      contractDate,
      contractType: 'service'
    });
    const contractBase64 = contractToBuffer(contractHtml);

    // 6. Send email with contract attachment
    const funFact = getRandomFunFact();
    const tpl = quoteWithPaymentLink(clientName, amountEur, title, session.url!, expiresAt, funFact);

    await sendEmail({
      to: clientEmail,
      eventType: 'quote.payment_link_sent',
      ...tpl,
      metadata: { quote_id: quote.id, session_id: session.id },
      attachments: [
        {
          filename: `Contrato_EXPERT_${title.replace(/\s+/g, '_').slice(0, 40)}.html`,
          content: contractBase64,
          type: 'text/html'
        }
      ]
    });

    await adminSupabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'quote.sent',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: { client_email: clientEmail, amount_eur: amountEur, stripe_session: session.id }
    }).then(() => {});

    // Background: create Holded estimate (presupuesto) for this quote
    syncQuoteAsEstimate({
      quoteId: quote.id,
      clientName,
      clientEmail,
      clientPhone: null,
      title,
      amountEur,
    }).catch((e) => console.error('[admin/quotes] holded estimate sync:', e));

    return NextResponse.json({ ok: true, quoteId: quote.id, stripeUrl: session.url });
  } catch (err) {
    console.error('[admin/quotes] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
