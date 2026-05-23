import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type NbaPriority = 'baja' | 'media' | 'alta' | 'critica';

export interface NbaParams {
  action_type: string;
  priority: NbaPriority;
  title: string;
  description?: string;
  client_id?: string;
  lead_id?: string;
  case_id?: string;
  due_at?: string;
  metadata?: Record<string, unknown>;
}

// Creates an NBA only if one with the same action_type + scope (case/lead/client) is not already open.
export async function createNba(params: NbaParams): Promise<void> {
  const admin = getSupabaseAdmin();

  // Build dedup filter: match on action_type + status=open + the most specific scope available
  const scopeField = params.case_id
    ? 'case_id'
    : params.lead_id
    ? 'lead_id'
    : params.client_id
    ? 'client_id'
    : null;

  if (scopeField) {
    const scopeValue = params.case_id ?? params.lead_id ?? params.client_id;
    const { data: existing } = await admin
      .from('next_best_actions')
      .select('id')
      .eq('action_type', params.action_type)
      .eq('status', 'open')
      .eq(scopeField, scopeValue!)
      .maybeSingle();

    if (existing) return;
  }

  const { error } = await admin.from('next_best_actions').insert({
    action_type:  params.action_type,
    priority:     params.priority,
    title:        params.title,
    description:  params.description ?? null,
    client_id:    params.client_id ?? null,
    lead_id:      params.lead_id ?? null,
    case_id:      params.case_id ?? null,
    due_at:       params.due_at ?? null,
    metadata:     params.metadata ?? {},
  });

  if (error) console.error('[createNba]', params.action_type, error.message);
}

// Closes (marks done) all open NBAs of a given type for a given scope.
export async function closeNba(params: {
  action_type: string;
  client_id?: string;
  lead_id?: string;
  case_id?: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();

  let query = admin
    .from('next_best_actions')
    .update({ status: 'done', resolved_at: new Date().toISOString() })
    .eq('action_type', params.action_type)
    .eq('status', 'open');

  if (params.case_id)   query = query.eq('case_id',   params.case_id);
  if (params.lead_id)   query = query.eq('lead_id',   params.lead_id);
  if (params.client_id) query = query.eq('client_id', params.client_id);

  const { error } = await query;
  if (error) console.error('[closeNba]', params.action_type, error.message);
}
