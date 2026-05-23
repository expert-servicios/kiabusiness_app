/**
 * Kia Contact Resolver
 *
 * Resolves a WhatsApp phone number into a typed KiaContactContext,
 * determining whether the contact is a Lead or an authenticated Client.
 * Used by the webhook and AI fallback to drive flow decisions.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export type KiaContactStatus = 'lead' | 'client';

export interface KiaContactContext {
  status                  : KiaContactStatus;
  phone                   : string;
  clientId                : string | null;
  leadId                  : string | null;
  name                    : string | null;
  email                   : string | null;
  role                    : string | null;
  profileCompleted        : boolean;
  billingReady            : boolean;
  habitualAddressReady    : boolean;
  openCases               : Array<{
    id         : string;
    service    : string;
    category   : string | null;
    state      : string;
    opened_at  : string;
  }>;
  pendingFiscalObligations: Array<{
    modelo     : string;
    description: string;
    deadline   : string;
    status     : string;
  }>;
  lastLeadStatus          : string | null;
  lastSelectedService     : string | null;
}

function normalize(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isClosedCase(state: string | null | undefined): boolean {
  return ['cerrado', 'finalizado', 'entregado'].includes((state ?? '').toLowerCase());
}

export async function resolveKiaContactContext(
  admin: Admin,
  phone: string,
): Promise<KiaContactContext> {
  const normalized = normalize(phone);
  const last9      = normalized.slice(-9);

  // ── 1. Look up profile ────────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, whatsapp_number, role, stripe_customer_id, country, client_type, tax_id, address, city, postal_code, habitual_address, habitual_city, habitual_postal_code, profile_completed, billing_ready, habitual_address_ready')
    .or(`phone.ilike.%${last9}%,whatsapp_number.ilike.%${last9}%`)
    .maybeSingle();

  if (profile) {
    const clientId = profile.id as string;

    const [{ data: allCases }, { data: obligations }] = await Promise.all([
      admin
        .from('cases')
        .select('id, service, category, state, opened_at')
        .eq('client_id', clientId)
        .order('opened_at', { ascending: false })
        .limit(10),
      admin
        .from('fiscal_obligations')
        .select('modelo, description, deadline, status')
        .eq('user_id', clientId)
        .eq('status', 'pending')
        .order('deadline')
        .limit(5),
    ]);

    const openCases = ((allCases ?? []) as KiaContactContext['openCases'])
      .filter((c) => !isClosedCase(c.state))
      .slice(0, 5);

    const hasPortalAccount = Boolean(profile.id && profile.role !== 'admin');
    const hasCases         = (allCases ?? []).length > 0;
    const status: KiaContactStatus =
      profile.role === 'client' || hasPortalAccount || hasCases ? 'client' : 'lead';

    const derivedProfileCompleted = !!(profile.full_name && (profile.phone || profile.whatsapp_number));
    const derivedBillingReady = !!(profile.client_type && profile.tax_id && profile.address && profile.city && profile.postal_code);
    const derivedHabitualAddressReady = profile.client_type === 'empresa'
      || !!(profile.habitual_address && profile.habitual_city && profile.habitual_postal_code);
    const profileCompleted = typeof profile.profile_completed === 'boolean'
      ? profile.profile_completed
      : derivedProfileCompleted;
    const billingReady = typeof profile.billing_ready === 'boolean'
      ? profile.billing_ready
      : derivedBillingReady;
    const habitualAddressReady = typeof profile.habitual_address_ready === 'boolean'
      ? profile.habitual_address_ready
      : derivedHabitualAddressReady;

    return {
      status,
      phone                   : normalized,
      clientId                : status === 'client' ? clientId : null,
      leadId                  : null,
      name                    : profile.full_name ?? null,
      email                   : profile.email ?? null,
      role                    : profile.role ?? null,
      profileCompleted,
      billingReady,
      habitualAddressReady,
      openCases               : status === 'client' ? openCases : [],
      pendingFiscalObligations: status === 'client' ? (obligations ?? []) as KiaContactContext['pendingFiscalObligations'] : [],
      lastLeadStatus          : null,
      lastSelectedService     : null,
    };
  }

  // ── 2. No profile → look up lead ─────────────────────────────────────────
  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, service, state')
    .or(`phone.ilike.%${last9}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    status                  : 'lead',
    phone                   : normalized,
    clientId                : null,
    leadId                  : lead?.id ?? null,
    name                    : lead?.name ?? null,
    email                   : lead?.email ?? null,
    role                    : null,
    profileCompleted        : false,
    billingReady            : false,
    habitualAddressReady    : false,
    openCases               : [],
    pendingFiscalObligations: [],
    lastLeadStatus          : lead?.state ?? null,
    lastSelectedService     : lead?.service ?? null,
  };
}
