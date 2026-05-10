import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface ExternalMapping {
  id: string;
  provider: string;
  local_entity: string;
  local_id: string;
  external_entity: string;
  external_id: string;
  tenant_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface MappingLookup {
  provider: string;
  localEntity: string;
  localId: string;
  externalEntity: string;
  tenantId?: string | null;
}

interface ExternalLookup {
  provider: string;
  externalEntity: string;
  externalId: string;
  tenantId?: string | null;
}

interface MappingUpsert extends MappingLookup {
  externalId: string;
  metadata?: Record<string, unknown>;
}

function applyTenantFilter<T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  tenantId?: string | null
): T {
  return tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
}

export async function findExternalMapping(params: MappingLookup): Promise<ExternalMapping | null> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('external_mappings')
    .select('*')
    .eq('provider', params.provider)
    .eq('local_entity', params.localEntity)
    .eq('local_id', params.localId)
    .eq('external_entity', params.externalEntity);

  query = applyTenantFilter(query, params.tenantId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data as ExternalMapping | null) ?? null;
}

export async function findMappingByExternalId(params: ExternalLookup): Promise<ExternalMapping | null> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('external_mappings')
    .select('*')
    .eq('provider', params.provider)
    .eq('external_entity', params.externalEntity)
    .eq('external_id', params.externalId);

  query = applyTenantFilter(query, params.tenantId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data as ExternalMapping | null) ?? null;
}

export async function upsertExternalMapping(params: MappingUpsert): Promise<ExternalMapping> {
  const supabase = getSupabaseAdmin();
  const existing = await findExternalMapping(params);
  const payload = {
    provider: params.provider,
    local_entity: params.localEntity,
    local_id: params.localId,
    external_entity: params.externalEntity,
    external_id: params.externalId,
    tenant_id: params.tenantId ?? null,
    metadata: params.metadata ?? {},
    updated_at: new Date().toISOString()
  };

  if (existing) {
    const { data, error } = await supabase
      .from('external_mappings')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return data as ExternalMapping;
  }

  const { data, error } = await supabase
    .from('external_mappings')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as ExternalMapping;
}
