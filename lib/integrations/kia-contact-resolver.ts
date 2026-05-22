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

export async function resolveKiaContactContext(
  admin: Admin,
  phone: string,
): Promise<KiaContactContext> {
  const normalized = normalize(phone);
  const last9      = normalized.slice(-9);

  // ── 1. Look up profile ────────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, whatsapp_number, role, stripe_customer_id, address, city, postal_code, country, tax_id, status')
    .or(`phone.ilike.%${last9}%,whatsapp_number.ilike.%${last9}%`)
    .maybeSingle();

  if (profile) {
    const clientId = profile.id as string;

    // Derive completeness flags from existing columns
    const profileCompleted     = !!(profile.full_name && profile.email && profile.phone && profile.tax_id);
    const billingReady         = !!profile.stripe_customer_id;
    const habitualAddressReady = !!(profile.address && profile.city && profile.postal_code && profile.country);

    // Fetch open expedientes and pending obligations in parallel
    const [{ data: cases }, { data: obligations }] = await Promise.all([
      admin
        .from('cases')
        .select('id, service, category, state, opened_at')
        .eq('client_id', clientId)
        .neq('state', 'cerrado')
        .order('opened_at', { ascending: false })
        .limit(5),
      admin
        .from('fiscal_obligations')
        .select('modelo, description, deadline, status')
        .eq('user_id', clientId)
        .eq('status', 'pending')
        .order('deadline')
        .limit(5),
    ]);

    return {
      status                  : 'client',
      phone                   : normalized,
      clientId,
      leadId                  : null,
      name                    : profile.full_name ?? null,
      email                   : profile.email ?? null,
      role                    : profile.role ?? null,
      profileCompleted,
      billingReady,
      habitualAddressReady,
      openCases               : (cases ?? []) as KiaContactContext['openCases'],
      pendingFiscalObligations: (obligations ?? []) as KiaContactContext['pendingFiscalObligations'],
      lastLeadStatus          : null,
      lastSelectedService     : null,
    };
  }

  // ── 2. No profile → look up lead ─────────────────────────────────────────
  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, service, status')
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
    lastLeadStatus          : lead?.status ?? null,
    lastSelectedService     : lead?.service ?? null,
  };
}
