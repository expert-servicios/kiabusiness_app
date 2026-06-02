import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? { admin, userId: user.id } : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const { admin } = auth;

    const { id } = await params;

    const [profileRes, authRes, casesRes, subsRes, quotesRes, waRes, companiesRes] = await Promise.all([
      admin
        .from('profiles')
        .select('id,email,full_name,phone,whatsapp_number,role,status,created_at,updated_at,stripe_customer_id,profile_completed,billing_ready,habitual_address_ready,active_company_id,tax_id,address,city,postal_code,province,billing_country')
        .eq('id', id)
        .single(),
      admin.auth.admin.getUserById(id),
      admin.from('cases').select('id,service,category,state,opened_at,closed_at,admin_note').eq('client_id', id).order('opened_at', { ascending: false }),
      admin.from('subscriptions').select('id,plan_name,status,current_period_start,current_period_end,canceled_at,stripe_subscription_id,stripe_customer_id,stripe_price_id,company_id,created_at').eq('client_id', id).order('created_at', { ascending: false }),
      admin.from('quotes').select('id,title,status,amount_eur,created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
      admin.from('whatsapp_conversations').select('id,direction,body,created_at,needs_review,ai_responded,media_type').eq('client_id', id).order('created_at', { ascending: false }).limit(8),
      admin
        .from('profile_companies')
        .select('role,company:companies(id,razon_social,nombre_comercial,cif_nif,forma_juridica,direccion,ciudad,provincia,codigo_postal,pais,email,telefono,stripe_customer_id,status,created_at,updated_at)')
        .eq('profile_id', id)
        .order('created_at', { ascending: false }),
    ]);

    const ordersRes = await admin
      .from('orders')
      .select('id,quote_id,amount_eur,currency,status,stripe_payment_id,holded_invoice_id,holded_sync_error,source,service_slugs,metadata,created_at,company_id')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(12);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const companies = (companiesRes.data ?? []).flatMap((row) => {
      const company = Array.isArray(row.company) ? row.company[0] : row.company;
      return company ? [{
        ...company,
        role: row.role ?? 'member',
        name: company.nombre_comercial ?? company.razon_social,
        nif: company.cif_nif,
        address: company.direccion,
        phone: company.telefono,
      }] : [];
    });
    const companyIds = companies.map((company) => company.id);

    const integrationQuery = admin
      .from('client_integrations')
      .select('id,client_id,company_id,provider,mode,api_version,api_key_last4,permissions_detected,status,sync_mode,last_sync_at,last_success_at,last_error,connected_by,disconnected_at,created_at,updated_at')
      .eq('provider', 'holded')
      .order('created_at', { ascending: false });

    const { data: integrations, error: integrationsError } = companyIds.length
      ? await integrationQuery.or(`client_id.eq.${id},company_id.in.(${companyIds.join(',')})`)
      : await integrationQuery.eq('client_id', id);

    if (integrationsError) {
      return NextResponse.json({ error: integrationsError.message }, { status: 500 });
    }

    const [{ data: directMappings }, { data: companyMappings }, { data: directEvents }, { data: companyEvents }] = await Promise.all([
      admin
        .from('external_mappings')
        .select('id,provider,local_entity,local_id,external_entity,external_id,company_id,tenant_id,metadata,created_at,updated_at')
        .eq('local_id', id)
        .order('updated_at', { ascending: false })
        .limit(25),
      companyIds.length
        ? admin
            .from('external_mappings')
            .select('id,provider,local_entity,local_id,external_entity,external_id,company_id,tenant_id,metadata,created_at,updated_at')
            .in('company_id', companyIds)
            .order('updated_at', { ascending: false })
            .limit(25)
        : Promise.resolve({ data: [] }),
      admin
        .from('integration_sync_events')
        .select('id,provider,direction,operation,local_entity,local_id,external_entity,external_id,status,attempt_count,error,metadata,created_at,updated_at,company_id,client_id,integration_id')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      companyIds.length
        ? admin
            .from('integration_sync_events')
            .select('id,provider,direction,operation,local_entity,local_id,external_entity,external_id,status,attempt_count,error,metadata,created_at,updated_at,company_id,client_id,integration_id')
            .in('company_id', companyIds)
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    const mappingById = new Map<string, unknown>();
    for (const mapping of [...(directMappings ?? []), ...(companyMappings ?? [])]) {
      mappingById.set(String(mapping.id), mapping);
    }
    const eventById = new Map<string, unknown>();
    for (const event of [...(directEvents ?? []), ...(companyEvents ?? [])]) {
      eventById.set(String(event.id), event);
    }

    const profileEmail = authRes.data.user?.email ?? profileRes.data.email ?? '';
    return NextResponse.json({
      profile:   { ...profileRes.data, email: profileEmail },
      cases:     casesRes.data    ?? [],
      subs:      (subsRes.data ?? []).map((sub) => ({ ...sub, plan: sub.plan_name })),
      quotes:    (quotesRes.data ?? []).map((quote) => ({ ...quote, service: quote.title })),
      orders:    ordersRes.data    ?? [],
      messages:  waRes.data       ?? [],
      companies,
      integrations: integrations ?? [],
      mappings: Array.from(mappingById.values()),
      syncEvents: Array.from(eventById.values())
        .sort((a, b) => new Date((b as { created_at: string }).created_at).getTime() - new Date((a as { created_at: string }).created_at).getTime())
        .slice(0, 25),
    });
  } catch (err) {
    console.error('[admin/clientes/[id]]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(_request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const { admin: adminClient } = auth;

    const { id } = await params;

    // Guard: do not delete other admins
    const { data: target } = await adminClient.from('profiles').select('role').eq('id', id).single();
    if (target?.role === 'admin') {
      return NextResponse.json({ error: 'No puedes eliminar un administrador' }, { status: 403 });
    }

    // Soft-delete: set status to inactive and clear sensitive fields
    const { error } = await adminClient
      .from('profiles')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/clientes/[id] DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const patchSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp_number: z.string().max(40).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  stripe_customer_id: z.string().max(120).optional().nullable(),
  profile_completed: z.boolean().optional(),
  billing_ready: z.boolean().optional(),
  habitual_address_ready: z.boolean().optional(),
  active_company_id: z.string().uuid().optional().nullable(),
  tax_id: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const { admin } = auth;

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key === 'email' || value === undefined) continue;
      update[key] = value === '' ? null : value;
    }
    update.updated_at = new Date().toISOString();

    if (Object.keys(update).length === 1 && !parsed.data.email) {
      return NextResponse.json({ error: 'Sin campos a actualizar' }, { status: 400 });
    }

    if (parsed.data.email) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        email: parsed.data.email,
        email_confirm: true,
      });
      if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
      update.email = parsed.data.email;
    }

    if (parsed.data.active_company_id) {
      const { data: membership, error: membershipError } = await admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', id)
        .eq('company_id', parsed.data.active_company_id)
        .maybeSingle();
      if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
      if (!membership) {
        return NextResponse.json({ error: 'La empresa activa debe estar vinculada al cliente' }, { status: 400 });
      }
    }

    const { data, error } = await admin
      .from('profiles')
      .update(update)
      .eq('id', id)
      .select('id,email,full_name,phone,whatsapp_number,status,stripe_customer_id,profile_completed,billing_ready,habitual_address_ready,active_company_id,tax_id,address,city,postal_code,province')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[admin/clientes/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
