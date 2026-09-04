import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isCompanyBillingReady } from '@/lib/companies/billing-readiness';

export type PlanMensualBlockReason =
  | 'no_company'
  | 'no_holded'
  | 'holded_error'
  | 'profile_incomplete'
  | 'billing_incomplete';

export interface PlanMensualGuardResult {
  allowed: boolean;
  reason?: PlanMensualBlockReason;
}

export const MONTHLY_PLAN_SERVICE_IDS = new Set([
  'plan-supervision', 'plan-avanzado', 'plan-colaborativo', 'svc_gestion_mensual', 'svc_autonomo_gestion',
]);

export function isMonthlyPlanService(serviceId: string): boolean {
  return MONTHLY_PLAN_SERVICE_IDS.has(serviceId);
}

export async function canCheckoutMonthlyPlan(userId: string): Promise<PlanMensualGuardResult> {
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('profile_completed, active_company_id')
    .eq('id', userId)
    .single();

  if (!profile?.profile_completed) return { allowed: false, reason: 'profile_incomplete' };
  if (!profile.active_company_id) return { allowed: false, reason: 'no_company' };

  const { data: membership } = await admin
    .from('profile_companies')
    .select('id')
    .eq('profile_id', userId)
    .eq('company_id', profile.active_company_id)
    .maybeSingle();
  if (!membership) return { allowed: false, reason: 'no_company' };

  const { data: company, error: companyError } = await admin
    .from('companies')
    .select('razon_social,cif_nif,direccion,ciudad,codigo_postal,pais')
    .eq('id', profile.active_company_id)
    .maybeSingle();
  if (companyError || !company || !isCompanyBillingReady(company)) {
    return { allowed: false, reason: 'billing_incomplete' };
  }

  const { data: integrations, error } = await admin
    .from('client_integrations')
    .select('status')
    .eq('provider', 'holded')
    .eq('company_id', profile.active_company_id)
    .neq('status', 'revoked')
    .limit(1);

  if (error) return { allowed: false, reason: 'holded_error' };
  const integration = integrations?.[0] ?? null;
  if (!integration) return { allowed: false, reason: 'no_holded' };
  if (integration.status !== 'active') return { allowed: false, reason: 'holded_error' };

  return { allowed: true };
}

export const PLAN_MENSUAL_BLOCK_MESSAGES: Record<PlanMensualBlockReason, string> = {
  no_company: 'Selecciona o crea la entidad fiscal que va a contratar el plan.',
  no_holded: 'Para contratar el plan mensual necesitas conectar Holded para esta entidad.',
  holded_error: 'La conexión con Holded de esta entidad tiene un error. Revísala antes de continuar.',
  profile_incomplete: 'Completa tu perfil antes de contratar.',
  billing_incomplete: 'Completa los datos fiscales de la entidad seleccionada antes de continuar.',
};

export const PLAN_MENSUAL_BLOCK_LINKS: Record<PlanMensualBlockReason, string> = {
  no_company: '/dashboard/empresa/nueva',
  no_holded: '/dashboard/integraciones/holded',
  holded_error: '/dashboard/integraciones/holded',
  profile_incomplete: '/dashboard/perfil',
  billing_incomplete: '/dashboard/empresa',
};