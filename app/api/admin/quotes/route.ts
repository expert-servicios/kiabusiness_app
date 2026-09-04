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
  companyId: z.string().uuid().nullable().optional(),
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

    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email?.toLowerCase() === clientEmail.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: 'No existe ningún usuario con ese email. Crea el usuario primero.' }, { status: 404 });
    }
    const clientId = authUser.id;

    const { data: clientProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('full_name,company,tax_id,address,city,postal_code,active_company_id')
      .eq('id', clientId)
      .single();
    if (profileError || !clientProfile) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil del cliente' }, { status: 500 });
    }

    const { data: memberships, error: membershipsError } = await adminSupabase
      .from('profile_companies')
      .select('company_id,company:companies(id,razon_social,cif_nif,forma_juridica,direccion,ciudad,codigo_postal,email,telefono)')
      .eq('profile_id', clientId);
    if (membershipsError) {
      return NextResponse.json({ error: 'No se pudieron resolver las entidades del cliente' }, { status: 500 });
    }

    let companyId = parsed.data.companyId ?? clientProfile.active_company_id ?? null;
    if (!companyId && (memberships?.length ?? 0) === 1) companyId = memberships![0].company_id;
    if (!companyId) {
      return NextResponse.json({
        error: (memberships?.length ?? 0) > 1
          ? 'El cliente tiene varias entidades. Selecciona cuál contrata el servicio.'
          : 'El cliente necesita una entidad fiscal antes de contratar el servicio.',
        code: 'company_required'
      }, { status: 409 });
    }

    const selectedMembership = memberships?.find((m) => m.company_id === companyId) ?? null;
    if (!selectedMembership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al cliente.' }, { status: 403 });
    }
    const companyRaw = selectedMembership.company;
    const contractingCompany = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;
    if (!contractingCompany) {
      return NextResponse.json({ error: 'No se pudo cargar la entidad seleccionada' }, { status: 500 });
    }

    const clientName = clientProfile.full_name ?? clientEmail.split('@')[0];
    const contractingName = contractingCompany.razon_social ?? clientName;
    const contractingTaxId = contractingCompany.cif_nif ?? null;
    const contractingAddress = contractingCompany.ciudad
      ? `${contractingCompany.direccion ?? ''}, ${contractingCompany.ciudad}`.trim().replace(/^,\s*/, '')
      : contractingCompany.direccion ?? null;

    // 1. Create lead (required FK for quotes). The lead remains a commercial
    // contact record; fiscal identity is held on quotes.company_id.
    const { data: lead, error: leadErr } = await adminSupabase
      .from('leads')
      .insert({
        name: clientName,
        email: clientEmail,
        client_type: contractingCompany.forma_juridica === 'autonomo' ? 'autonomo' : 'empresa',
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

    // 2. Create entity-scoped quote (without Stripe ID yet)
    const { data: quote, error: quoteErr } = await adminSupabase
      .from('quotes')
      .insert({
        lead_id: lead.id,
        client_id: clientId,
        company_id: companyId,
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

    // 3. Generate Stripe checkout session with explicit entity context.
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
      metadata: { quote_id: quote.id, company_id: companyId, product_type: 'presupuesto' },
      success_url: `${appUrl}/dashboard/expedientes?pago=ok`,
      cancel_url: `${appUrl}/dashboard?pago=cancelado`,
      expires_at: Math.floor(Date.now() / 1000) + expiresInDays * 86400
    });

    // 4. Update quote with Stripe checkout ID
    const { error: quoteStripeError } = await adminSupabase
      .from('quotes')
      .update({ stripe_checkout_id: session.id })
      .eq('id', quote.id);
    if (quoteStripeError) {
      try { await stripe.checkout.sessions.expire(session.id); } catch {}
      return NextResponse.json({ error: 'No se pudo registrar de forma segura el enlace de pago' }, { status: 500 });
    }

    // 5. Generate contract with fiscal data from the contracting entity.
    const contractDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail,
      clientCompany: contractingName,
      clientTaxId: contractingTaxId,
      clientAddress: contractingAddress,
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
      metadata: { quote_id: quote.id, company_id: companyId, session_id: session.id },
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
      metadata: { client_email: clientEmail, company_id: companyId, amount_eur: amountEur, stripe_session: session.id }
    }).then(() => {});

    // EXPERT's own Holded remains the seller accounting destination. Use the
    // contracting fiscal name while preserving the customer's delivery email.
    syncQuoteAsEstimate({
      quoteId: quote.id,
      clientName: contractingName,
      clientEmail,
      clientPhone: contractingCompany.telefono ?? null,
      title,
      amountEur,
    }).catch((e) => console.error('[admin/quotes] holded estimate sync:', e));

    return NextResponse.json({ ok: true, quoteId: quote.id, stripeUrl: session.url, companyId });
  } catch (err) {
    console.error('[admin/quotes] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
