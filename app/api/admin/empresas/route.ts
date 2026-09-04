import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return null;
  return profile?.role === 'admin' || profile?.role === 'owner' ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: companies, error } = await admin
    .from('companies')
    .select('id,razon_social,nombre_comercial,cif_nif,forma_juridica,status,email,telefono,ciudad,provincia,pais,stripe_customer_id,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const companyIds = (companies ?? []).map((company) => company.id);
  const [membershipsRes, subsRes, integrationsRes, checkoutsRes] = await Promise.all([
    companyIds.length
      ? admin.from('profile_companies').select('company_id,profile_id,role').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('subscriptions').select('company_id,status,plan_name,stripe_subscription_id').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('client_integrations').select('company_id,provider,status,sync_mode,last_success_at,last_error').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('checkout_sessions').select('company_id,status,stripe_session_id,metadata,created_at').in('company_id', companyIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profileIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.profile_id).filter(Boolean)));
  const profilesRes = profileIds.length
    ? await admin.from('profiles').select('id,full_name,email,status').in('id', profileIds)
    : { data: [] };
  const authUsers = profileIds.length
    ? await Promise.all(profileIds.map(async (profileId) => {
        const { data } = await admin.auth.admin.getUserById(profileId);
        return { id: profileId, email: data.user?.email ?? null };
      }))
    : [];
  const authEmailById = new Map(authUsers.map((row) => [row.id, row.email]));
  const profileById = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));

  const rows = (companies ?? []).map((company) => {
    const memberships = (membershipsRes.data ?? []).filter((row) => row.company_id === company.id);
    const owners = memberships.map((row) => {
      const profile = profileById.get(row.profile_id);
      return {
        id: row.profile_id,
        role: row.role,
        name: profile?.full_name ?? authEmailById.get(row.profile_id) ?? row.profile_id,
        email: authEmailById.get(row.profile_id) ?? profile?.email ?? null,
        status: profile?.status ?? null,
      };
    });
    const subscriptions = (subsRes.data ?? []).filter((row) => row.company_id === company.id);
    const activeSubscription = subscriptions.find((row) => row.status === 'active' || row.status === 'trialing') ?? null;
    const integrations = (integrationsRes.data ?? []).filter((row) => row.company_id === company.id);
    const lastCheckout = (checkoutsRes.data ?? []).find((row) => row.company_id === company.id) ?? null;
    return {
      ...company,
      display_name: company.nombre_comercial || company.razon_social || company.cif_nif || company.id,
      owners,
      active_subscription: activeSubscription,
      integrations,
      last_checkout: lastCheckout,
    };
  });

  return NextResponse.json({ companies: rows });
}
