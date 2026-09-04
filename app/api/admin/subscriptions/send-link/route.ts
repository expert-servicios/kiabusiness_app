import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { subscriptionInvite } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { generateContractHtml, contractToBuffer } from '@/lib/utils/contract';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { isStaffRole } from '@/lib/auth/roles';

const STRIPE_PRICE_ALLOWLIST: Record<string, string | undefined> = {
  STRIPE_PLAN_MONTHLY_49: process.env.STRIPE_PLAN_MONTHLY_49,
  STRIPE_PLAN_MONTHLY_99: process.env.STRIPE_PLAN_MONTHLY_99,
  STRIPE_PLAN_MONTHLY_199: process.env.STRIPE_PLAN_MONTHLY_199,
};

const schema = z.object({
  clientEmail: z.string().email('Email de cliente inválido'),
  companyId: z.string().uuid().nullable().optional(),
  planName: z.string().min(2),
  amountEur: z.number().positive(),
  stripePriceEnvKey: z.enum(['STRIPE_PLAN_MONTHLY_49', 'STRIPE_PLAN_MONTHLY_99', 'STRIPE_PLAN_MONTHLY_199'])
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return null;
  return isStaffRole(profile?.role) ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { clientEmail, planName, amountEur, stripePriceEnvKey } = parsed.data;
    const configuredPriceId = STRIPE_PRICE_ALLOWLIST[stripePriceEnvKey];
    if (!configuredPriceId) {
      return NextResponse.json({ error: 'El plan Stripe seleccionado no está configurado' }, { status: 503 });
    }

    const admin = getSupabaseAdmin();
    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email?.toLowerCase() === clientEmail.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: 'No existe ningún usuario con ese email. Crea el usuario primero.' }, { status: 404 });
    }
    const clientId = authUser.id;

    const { data: clientProfile, error: profileError } = await admin
      .from('profiles')
      .select('full_name,company,tax_id,address,city,postal_code,profile_completed,billing_ready')
      .eq('id', clientId)
      .single();

    if (profileError || !clientProfile) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil del cliente' }, { status: 500 });
    }
    if (!clientProfile.profile_completed) {
      return NextResponse.json({ error: 'El cliente debe completar su perfil antes de contratar.', code: 'profile_required' }, { status: 409 });
    }
    if (!clientProfile.billing_ready) {
      return NextResponse.json({ error: 'El cliente debe completar sus datos de facturación antes de contratar.', code: 'billing_required' }, { status: 409 });
    }

    const { data: memberships, error: membershipsError } = await admin
      .from('profile_companies')
      .select('company_id,role,company:companies(id,razon_social,cif_nif,direccion,ciudad,codigo_postal,stripe_customer_id)')
      .eq('profile_id', clientId);
    if (membershipsError) {
      return NextResponse.json({ error: 'No se pudieron resolver las entidades del cliente' }, { status: 500 });
    }

    let companyId = parsed.data.companyId ?? null;
    if (!companyId && (memberships?.length ?? 0) === 1) companyId = memberships![0].company_id;
    if (!companyId) {
      return NextResponse.json({
        error: (memberships?.length ?? 0) > 1
          ? 'El cliente tiene varias entidades. Selecciona cuál contrata el plan.'
          : 'El cliente necesita una entidad fiscal antes de contratar el plan.',
        code: 'company_required'
      }, { status: 409 });
    }

    const selectedMembership = memberships?.find((m) => m.company_id === companyId) ?? null;
    if (!selectedMembership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al cliente.' }, { status: 403 });
    }

    const companyRaw = selectedMembership.company;
    const company = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;
    if (!company) {
      return NextResponse.json({ error: 'No se pudo cargar la entidad seleccionada' }, { status: 500 });
    }

    const clientName = clientProfile.full_name ?? clientEmail.split('@')[0];
    const contractingName = company.razon_social ?? clientProfile.company ?? null;
    const contractingTaxId = company.cif_nif ?? clientProfile.tax_id ?? null;
    const contractingAddress = company.ciudad
      ? `${company.direccion ?? ''}, ${company.ciudad}`.trim().replace(/^,\s*/, '')
      : company.direccion ?? (clientProfile.city
        ? `${clientProfile.address ?? ''}, ${clientProfile.city}`.trim().replace(/^,\s*/, '')
        : clientProfile.address ?? null);

    const stripeCustomerId = company.stripe_customer_id ?? null;
    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const metadata = {
      user_id: clientId,
      company_id: companyId,
      plan_name: planName,
      product_type: 'suscripcion',
      configured_price_key: stripePriceEnvKey,
      configured_price_id: configuredPriceId,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: clientId,
      customer: stripeCustomerId ?? undefined,
      customer_email: stripeCustomerId ? undefined : clientEmail,
      ...(stripeCustomerId ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amountEur * 100),
          recurring: { interval: 'month' },
          product_data: {
            name: toStripeAscii(planName),
            metadata: { configured_price_key: stripePriceEnvKey, configured_price_id: configuredPriceId },
          },
        },
      }],
      metadata,
      subscription_data: { metadata },
      success_url: `${appUrl}/dashboard/post-compra?origin=subscription`,
      cancel_url: `${appUrl}/dashboard/suscripciones`
    });

    const { error: checkoutError } = await admin.from('checkout_sessions').insert({
      stripe_session_id: session.id,
      user_id: clientId,
      company_id: companyId,
      status: 'open',
      metadata: {
        product_type: 'subscription',
        plan_name: planName,
        amount_eur: amountEur,
        stripe_price_env_key: stripePriceEnvKey,
        created_by_admin: actorId,
      }
    });
    if (checkoutError) {
      console.error('[admin/subscriptions/send-link] checkout persistence failed:', checkoutError);
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error('[admin/subscriptions/send-link] failed to expire orphan Stripe session:', expireError);
      }
      return NextResponse.json({ error: 'No se pudo registrar de forma segura la invitación de contratación.' }, { status: 500 });
    }

    const contractDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail,
      clientCompany: contractingName,
      clientTaxId: contractingTaxId,
      clientAddress: contractingAddress,
      serviceTitle: planName,
      serviceDescription: `Suscripción mensual al ${planName} de EXPERT Estudios Profesionales. Gestión fiscal, contable y administrativa continua.`,
      amountEur,
      contractDate,
      contractType: 'subscription',
      planName
    });

    const tpl = subscriptionInvite(clientName, planName, amountEur, session.url!, getRandomFunFact());
    try {
      await sendEmail({
        to: clientEmail,
        eventType: 'subscription.invite_sent',
        ...tpl,
        metadata: { client_id: clientId, company_id: companyId, plan_name: planName, session_id: session.id },
        attachments: [{
          filename: `Contrato_Suscripcion_${planName.replace(/\s+/g, '_')}.html`,
          content: contractToBuffer(contractHtml),
          type: 'text/html'
        }]
      });
    } catch (emailError) {
      console.error('[admin/subscriptions/send-link] invite email failed:', emailError);
      let expireFailed = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        expireFailed = true;
        console.error('[admin/subscriptions/send-link] failed to expire checkout after email failure:', expireError);
      }

      const { error: statusError } = await admin
        .from('checkout_sessions')
        .update({
          status: expireFailed ? 'open' : 'expired',
          metadata: {
            product_type: 'subscription',
            plan_name: planName,
            amount_eur: amountEur,
            stripe_price_env_key: stripePriceEnvKey,
            created_by_admin: actorId,
            email_delivery_failed: true,
            stripe_expire_failed: expireFailed,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id);

      if (statusError) {
        console.error('[admin/subscriptions/send-link] failed to persist email compensation:', statusError);
      }

      return NextResponse.json({
        error: expireFailed
          ? 'El email no pudo enviarse y no se pudo invalidar automáticamente el enlace. Revisa la sesión Stripe antes de reintentar.'
          : 'El email no pudo enviarse. El enlace de contratación se ha invalidado de forma segura; puedes reintentar el envío.',
        code: expireFailed ? 'email_failed_manual_review' : 'email_failed_safe_retry'
      }, { status: 502 });
    }

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'subscription.invite_sent',
      entity: 'companies',
      entity_id: companyId,
      metadata: { client_id: clientId, client_email: clientEmail, company_id: companyId, plan_name: planName, session_id: session.id }
    }).then(() => {});

    return NextResponse.json({ ok: true, stripeUrl: session.url, sessionId: session.id, companyId });
  } catch (err) {
    console.error('[admin/subscriptions/send-link] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
