import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import {
  getServiceCheckoutByPriceId,
  getServiceCheckoutLineItem,
  getServiceCheckoutMetadata,
} from '@/lib/integrations/service-checkout';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isCompanyBillingReady, missingCompanyBillingFields } from '@/lib/companies/billing-readiness';

const checkoutSchema = z.object({
  priceId : z.string().min(1).optional(),
  priceIds: z.array(z.string().min(1)).min(1).max(10).optional(),
  companyId: z.string().uuid().optional(),
}).refine(d => d.priceId ?? d.priceIds, { message: 'priceId or priceIds is required' });

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para continuar.', requiresAuth: true }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,full_name,phone,email,profile_completed,active_company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Completa tu perfil antes de contratar.', code: 'profile_required', profileRequired: true }, { status: 409 });
    }
    if (!profile.profile_completed) {
      return NextResponse.json({ error: 'Completa nombre y teléfono antes de contratar.', code: 'profile_required', profileRequired: true }, { status: 409 });
    }

    const parseResult = checkoutSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de checkout no válidos.' }, { status: 400 });
    }

    const input = parseResult.data;
    const companyId = input.companyId ?? profile.active_company_id ?? null;
    if (!companyId) {
      return NextResponse.json({ error: 'Selecciona o crea la entidad fiscal que va a contratar el servicio.', code: 'company_required' }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('profile_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (membershipError) return NextResponse.json({ error: 'No se pudo validar la entidad seleccionada.' }, { status: 500 });
    if (!membership) return NextResponse.json({ error: 'La entidad seleccionada no pertenece al usuario.', code: 'company_forbidden' }, { status: 403 });

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('stripe_customer_id,razon_social,cif_nif,direccion,ciudad,codigo_postal,pais')
      .eq('id', companyId)
      .maybeSingle();
    if (companyError || !company) return NextResponse.json({ error: 'No se pudo resolver la entidad seleccionada.' }, { status: 500 });

    if (!isCompanyBillingReady(company)) {
      return NextResponse.json({
        error: 'Completa los datos fiscales de la entidad seleccionada antes de contratar.',
        code: 'billing_required',
        companyId,
        missingFields: missingCompanyBillingFields(company),
      }, { status: 409 });
    }

    const rawIds = input.priceIds ?? (input.priceId ? [input.priceId] : []);
    const checkoutServices = rawIds.map(id => {
      const svc = getServiceCheckoutByPriceId(id);
      if (!svc) throw Object.assign(new Error(`Servicio no válido: ${id}`), { _isUserError: true });
      return svc;
    });

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const cancelUrl = checkoutServices.length === 1
      ? `${appUrl}/servicios/${checkoutServices[0].category}/${checkoutServices[0].slug}`
      : `${appUrl}/carrito`;
    const stripeCustomerId = company.stripe_customer_id ?? null;
    const checkoutMetadata = {
      ...getServiceCheckoutMetadata(checkoutServices),
      user_id: user.id,
      company_id: companyId,
    };

    const session = await stripe.checkout.sessions.create({
      mode                       : 'payment',
      automatic_tax              : { enabled: true },
      billing_address_collection : 'required',
      tax_id_collection          : { enabled: true, required: 'if_supported' },
      client_reference_id        : user.id,
      customer                   : stripeCustomerId ?? undefined,
      customer_email             : stripeCustomerId ? undefined : user.email,
      ...(stripeCustomerId ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
      line_items                 : checkoutServices.map(getServiceCheckoutLineItem),
      success_url                : `${appUrl}/gracias/pago?source=${checkoutServices.length > 1 ? 'cart' : 'service'}&service=${checkoutServices[0].slug}`,
      cancel_url                 : cancelUrl,
      metadata                   : checkoutMetadata,
      locale                     : 'es',
    });

    const { error: persistError } = await admin.from('checkout_sessions').insert({
      stripe_session_id: session.id,
      user_id: user.id,
      company_id: companyId,
      status: 'open',
      metadata: {
        product_type: checkoutMetadata.product_type ?? (checkoutServices.length > 1 ? 'cart' : 'service'),
        service_slug: checkoutMetadata.service_slug ?? null,
        service_slugs: checkoutMetadata.service_slugs ?? null,
      },
    });

    if (persistError) {
      console.error('[services/checkout] checkout persistence failed:', persistError);
      try { await stripe.checkout.sessions.expire(session.id); } catch (expireError) {
        console.error('[services/checkout] failed to expire orphan Stripe session:', expireError);
      }
      return NextResponse.json({ error: 'No se pudo registrar de forma segura la sesión de pago.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, companyId });
  } catch (err: unknown) {
    const e = err as { _isUserError?: boolean; type?: string; code?: string; message?: string; statusCode?: number; raw?: unknown };
    if (e._isUserError) return NextResponse.json({ error: e.message }, { status: 400 });

    console.error('[services/checkout] error:', {
      type: e.type, code: e.code, message: e.message, statusCode: e.statusCode, raw: e.raw,
    });

    const msg = e.message ?? '';
    const userMsg = msg.includes('No such price')
      ? 'Producto no encontrado en Stripe. Contacta con soporte.'
      : 'Error al iniciar el pago.';
    return NextResponse.json({ error: userMsg, _detail: msg }, { status: 500 });
  }
}