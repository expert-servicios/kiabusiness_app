/**
 * IMP-014: Helpers de tenant para arquitectura multi-tenant.
 *
 * Fase 1: tenant_id nullable — la operativa EXPERT actual funciona sin tenant asignado.
 * Fase 2 (SaaS): poblar tenant_id en entidades y activar RLS tenant-aware.
 */

import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  plan: 'starter' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Devuelve el tenant_id del usuario indicado leyendo su perfil.
 * NULL si el usuario pertenece a la operativa legacy EXPERT.
 */
export async function getTenantIdForUser(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

/**
 * Devuelve el tenant completo por slug o id.
 * Acepta tanto UUID como slug (ej: 'expert').
 */
export async function getTenant(idOrSlug: string): Promise<Tenant | null> {
  const supabase = getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const query = isUuid
    ? supabase.from('tenants').select('*').eq('id', idOrSlug)
    : supabase.from('tenants').select('*').eq('slug', idOrSlug);
  const { data } = await query.maybeSingle();
  return (data as Tenant | null) ?? null;
}

/**
 * Devuelve el tenant del usuario autenticado.
 * Si no tiene tenant asignado, devuelve el tenant 'expert' (operativa propia).
 */
export async function getTenantForUser(userId: string): Promise<Tenant | null> {
  const tenantId = await getTenantIdForUser(userId);
  if (tenantId) return getTenant(tenantId);
  // Fallback al tenant EXPERT para usuarios legacy sin tenant asignado
  return getTenant('expert');
}

/**
 * Asigna un tenant_id a un perfil.
 * Usar con precaución — operación de onboarding de asesoria.
 */
export async function assignTenantToUser(
  userId: string,
  tenantId: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Verificar que el tenant existe y está activo
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, active')
    .eq('id', tenantId)
    .maybeSingle();

  if (!tenant) return { error: 'tenant_not_found' };
  if (!tenant.active) return { error: 'tenant_inactive' };

  const { error } = await supabase
    .from('profiles')
    .update({ tenant_id: tenantId })
    .eq('id', userId);

  return { error: error?.message ?? null };
}

/**
 * Crea un nuevo tenant para una asesoria.
 * Devuelve el tenant creado o un error.
 */
export async function createTenant(params: {
  slug: string;
  name: string;
  domain?: string;
  plan?: Tenant['plan'];
  settings?: Record<string, unknown>;
}): Promise<{ tenant: Tenant | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      slug: params.slug,
      name: params.name,
      domain: params.domain ?? null,
      plan: params.plan ?? 'starter',
      settings: params.settings ?? {},
    })
    .select()
    .single();

  if (error) return { tenant: null, error: error.message };
  return { tenant: data as Tenant, error: null };
}
