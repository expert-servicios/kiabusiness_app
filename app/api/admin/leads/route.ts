import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const LIFECYCLE_STAGES = ['lead', 'prospect', 'customer', 'former_customer'] as const;
const STRIPE_ACTIVITIES = ['no_activity', 'abandoned', 'paid', 'subscribed'] as const;
const MARKETING_STATUSES = ['unknown', 'consented', 'unsubscribed', 'blocked'] as const;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return admin;
}

function positiveInt(raw: string | null, fallback: number, max: number) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const page = positiveInt(url.searchParams.get('page'), 1, 100000);
    const limit = positiveInt(url.searchParams.get('limit'), 50, 100);
    const lifecycle = url.searchParams.get('lifecycle');
    const activity = url.searchParams.get('activity');
    const marketing = url.searchParams.get('marketing');
    const rawSearch = url.searchParams.get('q')?.trim() ?? '';
    const search = rawSearch.replace(/[,%()]/g, ' ').trim().slice(0, 100);

    let query = admin
      .from('leads')
      .select(
        'id,name,email,phone,client_type,category,service,country,state,source,created_at,updated_at,lifecycle_stage,stripe_activity,marketing_status,marketing_consent_at,marketing_source,first_stripe_activity_at,last_stripe_activity_at',
        { count: 'exact' },
      )
      .order('last_stripe_activity_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lifecycle && LIFECYCLE_STAGES.includes(lifecycle as (typeof LIFECYCLE_STAGES)[number])) {
      query = query.eq('lifecycle_stage', lifecycle);
    }
    if (activity && STRIPE_ACTIVITIES.includes(activity as (typeof STRIPE_ACTIVITIES)[number])) {
      query = query.eq('stripe_activity', activity);
    }
    if (marketing && MARKETING_STATUSES.includes(marketing as (typeof MARKETING_STATUSES)[number])) {
      query = query.eq('marketing_status', marketing);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const [listResult, totalResult, leadsResult, prospectsResult, customersResult, formerResult, subscribedResult, paidResult, abandonedResult, consentedResult, unknownResult] = await Promise.all([
      query,
      admin.from('leads').select('id', { count: 'exact', head: true }),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'lead'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'prospect'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'customer'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'former_customer'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'subscribed'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'paid'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'abandoned'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('marketing_status', 'consented'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('marketing_status', 'unknown'),
    ]);

    if (listResult.error) throw listResult.error;

    const leads = listResult.data ?? [];
    const leadIds = leads.map((lead) => lead.id);
    const summaries = new Map<string, {
      customer_count: number;
      active_subscription: boolean;
      successful_charges: number;
      succeeded_payment_intents: number;
      paid_invoices: number;
      paid_checkouts: number;
      last_activity_at: string | null;
    }>();

    if (leadIds.length > 0) {
      const { data: mappings, error: mappingError } = await admin
        .from('lead_stripe_customers')
        .select('lead_id,stripe_customer_id,has_active_subscription,successful_charges,succeeded_payment_intents,paid_invoices,paid_checkouts,last_activity_at')
        .in('lead_id', leadIds);

      if (mappingError) throw mappingError;

      for (const mapping of mappings ?? []) {
        const current = summaries.get(mapping.lead_id) ?? {
          customer_count: 0,
          active_subscription: false,
          successful_charges: 0,
          succeeded_payment_intents: 0,
          paid_invoices: 0,
          paid_checkouts: 0,
          last_activity_at: null,
        };
        current.customer_count += 1;
        current.active_subscription ||= Boolean(mapping.has_active_subscription);
        current.successful_charges += mapping.successful_charges ?? 0;
        current.succeeded_payment_intents += mapping.succeeded_payment_intents ?? 0;
        current.paid_invoices += mapping.paid_invoices ?? 0;
        current.paid_checkouts += mapping.paid_checkouts ?? 0;
        if (mapping.last_activity_at && (!current.last_activity_at || mapping.last_activity_at > current.last_activity_at)) {
          current.last_activity_at = mapping.last_activity_at;
        }
        summaries.set(mapping.lead_id, current);
      }
    }

    return NextResponse.json({
      leads: leads.map((lead) => ({
        ...lead,
        stripe_summary: summaries.get(lead.id) ?? {
          customer_count: 0,
          active_subscription: false,
          successful_charges: 0,
          succeeded_payment_intents: 0,
          paid_invoices: 0,
          paid_checkouts: 0,
          last_activity_at: null,
        },
      })),
      pagination: {
        page,
        limit,
        total: listResult.count ?? 0,
        pages: Math.max(1, Math.ceil((listResult.count ?? 0) / limit)),
      },
      stats: {
        total: totalResult.count ?? 0,
        leads: leadsResult.count ?? 0,
        prospects: prospectsResult.count ?? 0,
        customers: customersResult.count ?? 0,
        former_customers: formerResult.count ?? 0,
        subscribed: subscribedResult.count ?? 0,
        paid: paidResult.count ?? 0,
        abandoned: abandonedResult.count ?? 0,
        marketing_consented: consentedResult.count ?? 0,
        marketing_unknown: unknownResult.count ?? 0,
      },
    });
  } catch (error) {
    console.error('[admin/leads] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const lifecycleStage = body?.lifecycle_stage;
    if (!LIFECYCLE_STAGES.includes(lifecycleStage)) {
      return NextResponse.json({ error: 'Etapa no válida' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('leads')
      .update({ lifecycle_stage: lifecycleStage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,lifecycle_stage')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

    return NextResponse.json({ ok: true, lead: data });
  } catch (error) {
    console.error('[admin/leads] PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
