import { getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type AppointmentRow = {
  id: string;
  service: string | null;
  appointment_type: string | null;
  status: string | null;
  appointment_date: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  email?: string | null;
};

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export async function getAuthorizedBookingEmails(
  admin: AdminClient,
  clientId: string,
  companyId: string | null | undefined,
  authEmail: string | null | undefined,
): Promise<string[]> {
  const emails = new Set<string>();
  const normalizedAuth = normalizeEmail(authEmail);
  if (normalizedAuth) emails.add(normalizedAuth);

  if (companyId) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', clientId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (membershipError) throw membershipError;

    if (membership) {
      const { data: company, error: companyError } = await admin
        .from('companies')
        .select('email')
        .eq('id', companyId)
        .maybeSingle();
      if (companyError) throw companyError;
      const companyEmail = normalizeEmail(company?.email);
      if (companyEmail) emails.add(companyEmail);
    }
  }

  return [...emails];
}

export async function loadOnboardingAppointmentsForIdentity(
  admin: AdminClient,
  clientId: string,
  companyId: string | null | undefined,
  authEmail: string | null | undefined,
): Promise<AppointmentRow[]> {
  const emails = await getAuthorizedBookingEmails(admin, clientId, companyId, authEmail);
  if (!emails.length) return [];

  const results = await Promise.all(emails.map(async (email) => {
    const { data, error } = await admin
      .from('appointments')
      .select('id,email,service,appointment_type,status,appointment_date,confirmed_date,confirmed_time')
      .ilike('email', email)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AppointmentRow[];
  }));

  const unique = new Map<string, AppointmentRow>();
  for (const row of results.flat()) unique.set(row.id, row);
  return [...unique.values()].sort((a, b) => {
    const aTime = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
    const bTime = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * Resolve a Cal.com attendee email to a customer only when the identity is
 * unambiguous: either it is the auth email, or it is the email of exactly one
 * company with exactly one active/trialing subscription owner.
 */
export async function resolveBookingClientIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const authUsers = await listAllAuthUsers();
  const direct = authUsers.find((user) => normalizeEmail(user.email) === normalized);
  if (direct) return direct.id;

  const { data: companies, error: companyError } = await admin
    .from('companies')
    .select('id')
    .ilike('email', normalized)
    .limit(2);
  if (companyError) throw companyError;
  if (!companies || companies.length !== 1) return null;

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('client_id')
    .eq('company_id', companies[0].id)
    .in('status', ['active', 'trialing'])
    .limit(2);
  if (subscriptionError) throw subscriptionError;

  const clientIds = [...new Set((subscriptions ?? []).map((row) => row.client_id).filter(Boolean))];
  return clientIds.length === 1 ? clientIds[0] : null;
}
