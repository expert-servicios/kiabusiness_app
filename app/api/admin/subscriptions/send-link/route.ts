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

const PLAN_AMOUNT_ALLOWLIST = {
  STRIPE_PLAN_MONTHLY_49: 49,
  STRIPE_PLAN_MONTHLY_99: 99,
  STRIPE_PLAN_MONTHLY_199: 199,
} as const;

const schema = z.object({
  clientEmail: z.string().email('Email de cliente inválido'),
  companyId: z.string().uuid().nullable().optional(),
  planName: z.string().min(2),
  amountEur: z.number().positive(),
  stripePriceEnvKey: z.enum(['STRIPE_PLAN_MONTHLY_49', 'STRIPE_PLAN_MONTHLY_99', 'STRIPE_PLAN_MONTHLY_199']),
  sendEmail: z.boolean().optional().default(true),
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

    const { clientEmail, planName, amountEur, stripePriceEnvKey, sendEmail: shouldSendEmail } = parsed.data;
    const normalizedEmail = clientEmail.trim().toLowerCase();
    const configuredPriceId = STRIPE_PRICE_ALLOWLIST[stripePriceEnvKey];
    if (!configuredPriceId) {
      return NextResponse.json({ error: 'El plan Stripe seleccionado no está configurado' }, { status: 503 });
    }

    const expectedAmountEur = PLAN_AMOUNT_ALLOWLIST[stripePriceEnvKey];
    if (amountEur !== expectedAmountEur) {
      return NextResponse.json({
        error: `El importe del plan no coincide con la tarifa configurada (${expectedAmountEur} €).`,
        code: 'plan_amount_mismatch',
      }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email?.toLowerCase() === normalizedEmail);
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

    const selectedMembership = memberships?.find((membership) => membership.company_id === companyId) ?? null;
    if (!selectedMembership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al cliente.' }, { status: 403 });
    }
    const companyRaw = selectedMembership.company;
    const company = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;
    if (!company) return NextResponse.json({ error: 'No se pudo cargar la entidad seleccionada' }, { status: 500 });

    const { data: existingSubscription, error: subscriptionLookupError } = await admin
      .from('subscriptions')
      .select('id,status,stripe_subscription_id')
      .eq('client_id', clientId)
      .eq('company_id', companyId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();
    if (subscriptionLookupError) {
      return NextResponse.json({ error: 'No se pudo validar el estado actual de la suscripción.' }, { status: 500 });
    }
    if (existingSubscription) {
      return NextResponse.json({
        error: 'El cliente ya tiene una suscripción activa para esta entidad. Revisa el estado antes de crear otro checkout.',
        code: 'subscription_exists',
        subscriptionId: existingSubscription.id,
      }, { status: 409 });
    }

    const { data: existingCheckout, error: checkoutLookupError } = await admin
      .from('checkout_sessions')
      .select('stripe_session_id,status,metadata')
      .eq('user_id', clientId)
      .eq('company_id', companyId)
      .eq('status', 'open')
      .contains('metadata', { product_type: 'subscription' })
      .limit(1)
      .maybeSingle();
    if (checkoutLookupError) {
      return NextResponse.json({ error: 'No se pudo validar si existe una sesión de contratación abierta.' }, { status: 500 });
    }
    if (existingCheckout) {
      return NextResponse.json({
        error: 'Ya existe una sesión de contratación abierta para esta entidad. Verifícala o expírala antes de crear otra.',
        code: 'checkout_exists',
        sessionId: existingCheckout.stripe_session_id,
      }, { status: 409 });
    }

    const clientName = clientProfile.full_name ?? normalizedEmail.split('@')[0];
    const contractingName = company.razon_social ?? clientProfile.company ?? null;
    const contractingTaxId = company.cif_nif ?? clientProfile.tax_id ?? null;
    const contractingAddress = company.ciudad
      ? `${company.direccion ?? ''}, ${company.ciudad}`.trim().replace(/^,\s*/, '')
      : company.direccion ?? (clientProfile.city
        ? `${clientProfile.address ?? ''}, ${clientProfile.city}`.trim().replace(/^,\s*/, '')
        : clientProfile.address ?? null);

    // Canonical commercial trace: lead -> quote -> onboarding case -> checkout.
    // Reuse current records so retries never create duplicate proposals.
    let leadId: string;
    const { data: existingLead, error: leadLookupError } = await admin
      .from('leads')
      .select('id,state')
      .ilike('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (leadLookupError) return NextResponse.json({ error: 'No se pudo validar el lead comercial.' }, { status: 500 });
    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: createdLead, error: leadCreateError } = await admin
        .from('leads')
        .insert({
          name: clientName,
          email: normalizedEmail,
          client_type: 'client',
          category: 'subscription',
          service: planName,
          country: 'ES',
          state: 'converted',
          source: 'admin_subscription',
          notes: `Lead creado automáticamente para mantener trazabilidad comercial de ${planName}.`,
        })
        .select('id')
        .single();
      if (leadCreateError || !createdLead) {
        return NextResponse.json({ error: 'No se pudo crear la trazabilidad comercial del cliente.' }, { status: 500 });
      }
      leadId = createdLead.id;
    }

    let quoteId: string;
    const { data: existingQuote, error: quoteLookupError } = await admin
      .from('quotes')
      .select('id,status,amount_eur,stripe_checkout_id')
      .eq('client_id', clientId)
      .eq('company_id', companyId)
      .eq('title', planName)
      .in('status', ['draft', 'sent', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (quoteLookupError) return NextResponse.json({ error: 'No se pudo validar el presupuesto comercial.' }, { status: 500 });
    if (existingQuote) {
      if (Number(existingQuote.amount_eur) !== expectedAmountEur) {
        return NextResponse.json({
          error: 'Existe un presupuesto abierto del mismo plan con un importe diferente. Revisión manual necesaria.',
          code: 'quote_amount_conflict',
          quoteId: existingQuote.id,
        }, { status: 409 });
      }
      quoteId = existingQuote.id;
    } else {
      const { data: createdQuote, error: quoteCreateError } = await admin
        .from('quotes')
        .insert({
          lead_id: leadId,
          client_id: clientId,
          company_id: companyId,
          title: planName,
          description: `Suscripción mensual ${planName}. Importe base ${expectedAmountEur} EUR + impuestos aplicables.`,
          amount_eur: expectedAmountEur,
          status: 'draft',
          created_by: actorId,
          docs_checklist: [],
        })
        .select('id')
        .single();
      if (quoteCreateError || !createdQuote) {
        return NextResponse.json({ error: 'No se pudo crear el presupuesto de suscripción.' }, { status: 500 });
      }
      quoteId = createdQuote.id;
    }

    let onboardingCaseId: string | null = null;
    const { data: existingOnboarding, error: onboardingLookupError } = await admin
      .from('cases')
      .select('id,quote_id,company_id')
      .eq('client_id', clientId)
      .eq('service', 'Alta de usuario')
      .neq('state', 'finalizado')
      .limit(1)
      .maybeSingle();
    if (!onboardingLookupError && existingOnboarding) {
      onboardingCaseId = existingOnboarding.id;
      await admin.from('cases').update({
        quote_id: existingOnboarding.quote_id ?? quoteId,
        company_id: existingOnboarding.company_id ?? companyId,
        next_action: 'Finalizar contratación de la suscripción',
        updated_at: new Date().toISOString(),
      }).eq('id', existingOnboarding.id);
    } else if (!existingOnboarding) {
      const { data: createdCase, error: caseCreateError } = await admin
        .from('cases')
        .insert({
          client_id: clientId,
          company_id: companyId,
          quote_id: quoteId,
          category: 'onboarding',
          service: 'Alta de usuario',
          state: 'en_proceso',
          status: 'nuevo',
          priority: 'media',
          next_action: 'Finalizar contratación de la suscripción',
          admin_note: 'Expediente creado automáticamente desde la preparación de suscripción Admin.',
        })
        .select('id')
        .single();
      if (caseCreateError) console.error('[admin/subscriptions/send-link] onboarding case error:', caseCreateError);
      else onboardingCaseId = createdCase.id;
    }

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
      quote_id: quoteId,
      lead_id: leadId,
      onboarding_case_id: onboardingCaseId ?? '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: clientId,
      customer: stripeCustomerId ?? undefined,
      customer_email: stripeCustomerId ? undefined : normalizedEmail,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true, required: 'if_supported' },
      automatic_tax: { enabled: true },
      ...(stripeCustomerId ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(expectedAmountEur * 100),
          tax_behavior: 'exclusive',
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
        amount_eur: expectedAmountEur,
        stripe_price_env_key: stripePriceEnvKey,
        created_by_admin: actorId,
        automatic_tax: true,
        tax_behavior: 'exclusive',
        email_sent: false,
        quote_id: quoteId,
        lead_id: leadId,
        onboarding_case_id: onboardingCaseId,
      }
    });
    if (checkoutError) {
      console.error('[admin/subscriptions/send-link] checkout persistence failed:', checkoutError);
      try { await stripe.checkout.sessions.expire(session.id); } catch (expireError) {
        console.error('[admin/subscriptions/send-link] failed to expire orphan Stripe session:', expireError);
      }
      return NextResponse.json({ error: 'No se pudo registrar de forma segura la invitación de contratación.' }, { status: 500 });
    }

    const quoteStatus = shouldSendEmail ? 'sent' : 'draft';
    const { error: quoteLinkError } = await admin
      .from('quotes')
      .update({ stripe_checkout_id: session.id, status: quoteStatus })
      .eq('id', quoteId);
    if (quoteLinkError) {
      console.error('[admin/subscriptions/send-link] quote link failed:', quoteLinkError);
      let expired = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
        expired = true;
      } catch (expireError) {
        console.error('[admin/subscriptions/send-link] failed to expire checkout after quote link failure:', expireError);
      }
      if (expired) await admin.from('checkout_sessions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('stripe_session_id', session.id);
      return NextResponse.json({
        error: expired
          ? 'No se pudo vincular el checkout al presupuesto. La sesión se ha invalidado de forma segura.'
          : 'No se pudo vincular el checkout al presupuesto y la sesión requiere revisión manual.',
        code: expired ? 'quote_link_failed_safe_retry' : 'quote_link_failed_manual_review',
      }, { status: 500 });
    }

    if (!shouldSendEmail) {
      await admin.from('audit_logs').insert({
        actor_id: actorId,
        action: 'subscription.checkout_generated',
        entity: 'companies',
        entity_id: companyId,
        metadata: { client_id: clientId, client_email: normalizedEmail, company_id: companyId, plan_name: planName, session_id: session.id, lead_id: leadId, quote_id: quoteId, onboarding_case_id: onboardingCaseId }
      }).then(() => {});

      return NextResponse.json({
        ok: true,
        stripeUrl: session.url,
        sessionId: session.id,
        companyId,
        leadId,
        quoteId,
        onboardingCaseId,
        emailSent: false,
      });
    }

    const contractDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail: normalizedEmail,
      clientCompany: contractingName,
      clientTaxId: contractingTaxId,
      clientAddress: contractingAddress,
      serviceTitle: planName,
      serviceDescription: `Suscripción mensual al ${planName} de EXPERT Estudios Profesionales. Gestión fiscal, contable y administrativa continua.`,
      amountEur: expectedAmountEur,
      contractDate,
      contractType: 'subscription',
      planName
    });

    const tpl = subscriptionInvite(clientName, planName, expectedAmountEur, session.url!, getRandomFunFact());
    try {
      await sendEmail({
        to: normalizedEmail,
        eventType: 'subscription.invite_sent',
        ...tpl,
        metadata: { client_id: clientId, company_id: companyId, plan_name: planName, session_id: session.id, quote_id: quoteId, case_id: onboardingCaseId },
        attachments: [{
          filename: `Contrato_Suscripcion_${planName.replace(/\s+/g, '_')}.html`,
          content: contractToBuffer(contractHtml),
          type: 'text/html'
        }]
      });
    } catch (emailError) {
      console.error('[admin/subscriptions/send-link] invite email failed:', emailError);
      let expireFailed = false;
      try { await stripe.checkout.sessions.expire(session.id); } catch (expireError) {
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
            amount_eur: expectedAmountEur,
            stripe_price_env_key: stripePriceEnvKey,
            created_by_admin: actorId,
            automatic_tax: true,
            tax_behavior: 'exclusive',
            email_delivery_failed: true,
            stripe_expire_failed: expireFailed,
            quote_id: quoteId,
            lead_id: leadId,
            onboarding_case_id: onboardingCaseId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id);
      if (!expireFailed) await admin.from('quotes').update({ status: 'draft' }).eq('id', quoteId);
      if (statusError) console.error('[admin/subscriptions/send-link] failed to persist email compensation:', statusError);

      return NextResponse.json({
        error: expireFailed
          ? 'El email no pudo enviarse y no se pudo invalidar automáticamente el enlace. Revisa la sesión Stripe antes de reintentar.'
          : 'El email no pudo enviarse. El enlace de contratación se ha invalidado de forma segura; puedes reintentar el envío.',
        code: expireFailed ? 'email_failed_manual_review' : 'email_failed_safe_retry'
      }, { status: 502 });
    }

    await admin
      .from('checkout_sessions')
      .update({
        metadata: {
          product_type: 'subscription',
          plan_name: planName,
          amount_eur: expectedAmountEur,
          stripe_price_env_key: stripePriceEnvKey,
          created_by_admin: actorId,
          automatic_tax: true,
          tax_behavior: 'exclusive',
          email_sent: true,
          quote_id: quoteId,
          lead_id: leadId,
          onboarding_case_id: onboardingCaseId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', session.id);

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'subscription.invite_sent',
      entity: 'companies',
      entity_id: companyId,
      metadata: { client_id: clientId, client_email: normalizedEmail, company_id: companyId, plan_name: planName, session_id: session.id, lead_id: leadId, quote_id: quoteId, onboarding_case_id: onboardingCaseId }
    }).then(() => {});

    return NextResponse.json({ ok: true, stripeUrl: session.url, sessionId: session.id, companyId, leadId, quoteId, onboardingCaseId, emailSent: true });
  } catch (err) {
    console.error('[admin/subscriptions/send-link] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
