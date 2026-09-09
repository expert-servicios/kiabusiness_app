import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface KiaAuthoritativeCaseStatus {
  id: string;
  serviceName: string | null;
  status: string;
  nextAction: null;
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

/**
 * Load recent case statuses directly from the server-side database scope.
 *
 * `KiaContext.cases` intentionally contains only active cases, so it cannot be
 * used to decide whether the user's sole case is already completed. This query
 * is presentation-only, remains scoped to the authenticated client and active
 * company, and never accepts case state from the browser or model output.
 *
 * `null` means the authoritative lookup failed or could not be performed.
 * An empty array is an authoritative result meaning that no cases were found.
 */
export async function loadKiaAuthoritativeCaseStatuses(
  admin: AdminClient,
  clientId: string | null,
  companyId: string | null,
): Promise<KiaAuthoritativeCaseStatus[] | null> {
  if (!clientId) return null;

  try {
    let query = admin
      .from('cases')
      .select('id, service, state, status, opened_at')
      .eq('client_id', clientId);

    if (companyId) query = query.eq('company_id', companyId);

    const { data, error } = await query
      .order('opened_at', { ascending: false })
      .limit(10);

    if (error) return null;

    return ((data ?? []) as Array<{
      id: string;
      service: string | null;
      state: string | null;
      status: string | null;
    }>).map((row) => ({
      id: row.id,
      serviceName: row.service,
      status: row.status ?? row.state ?? 'desconocido',
      nextAction: null,
    }));
  } catch {
    return null;
  }
}
