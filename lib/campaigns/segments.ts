import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type SegmentKey =
  | 'all_active'      // all active clients
  | 'subscribers'     // clients with active subscription
  | 'no_subscription' // active clients without active subscription
  | 'leads'           // unconverted leads
  | 'all'             // everyone (active + inactive clients)
  | 'newsletter';     // newsletter subscribers

export interface Recipient {
  email: string;
  name: string | null;
}

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  all_active:      'Todos los clientes activos',
  subscribers:     'Suscriptores activos',
  no_subscription: 'Clientes sin suscripción',
  leads:           'Leads (no convertidos)',
  all:             'Todos (activos + inactivos)',
  newsletter:      'Suscriptores newsletter',
};

export async function getSegmentRecipients(segment: SegmentKey): Promise<Recipient[]> {
  const admin = getSupabaseAdmin();

  if (segment === 'newsletter') {
    const { data } = await admin
      .from('newsletter_subscribers')
      .select('email, name')
      .eq('confirmed', true)
      .is('unsubscribed_at', null);
    return (data ?? []).map((r) => ({ email: r.email, name: r.name ?? null }));
  }

  if (segment === 'leads') {
    const { data } = await admin
      .from('leads')
      .select('email, name')
      .not('state', 'eq', 'converted')
      .not('email', 'is', null);
    return (data ?? []).map((r) => ({ email: r.email, name: r.name ?? null }));
  }

  // Base: profiles with role='client'
  let profileQuery = admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'client');

  if (segment !== 'all') {
    profileQuery = profileQuery.eq('status', 'active');
  }

  const { data: profiles } = await profileQuery;
  const profileEmails = new Map<string, { name: string | null; id: string }>(
    (profiles ?? []).filter((p) => p.email).map((p) => [p.id, { name: p.full_name, id: p.id }])
  );

  if (segment === 'all_active' || segment === 'all') {
    return (profiles ?? [])
      .filter((p) => p.email)
      .map((p) => ({ email: p.email!, name: p.full_name ?? null }));
  }

  // Resolve auth emails for profiles without email column
  const ids = (profiles ?? []).filter((p) => !p.email).map((p) => p.id);
  const emailById = new Map<string, string>();
  if (ids.length > 0) {
    // Batch auth lookup (up to 1000)
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authUsers?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  }

  const allRecipients: Recipient[] = (profiles ?? []).map((p) => ({
    email: p.email ?? emailById.get(p.id) ?? '',
    name: p.full_name ?? null,
  })).filter((r) => r.email);

  if (segment === 'subscribers') {
    const { data: subs } = await admin
      .from('subscriptions')
      .select('client_id')
      .eq('status', 'active');
    const subIds = new Set((subs ?? []).map((s) => s.client_id));
    return allRecipients.filter((r) => {
      const id = Array.from(profileEmails.entries()).find(([, v]) => v.name === r.name)?.[0];
      return id ? subIds.has(id) : false;
    });
  }

  if (segment === 'no_subscription') {
    const { data: subs } = await admin
      .from('subscriptions')
      .select('client_id')
      .eq('status', 'active');
    const subIds = new Set((subs ?? []).map((s) => s.client_id));
    const profilesByEmail = new Map(
      (profiles ?? []).filter((p) => p.email).map((p) => [p.email!, p.id])
    );
    return allRecipients.filter((r) => {
      const id = profilesByEmail.get(r.email);
      return id ? !subIds.has(id) : true;
    });
  }

  return allRecipients;
}
