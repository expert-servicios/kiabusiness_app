import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type PlanMensualBlockReason =
  | 'no_company'
  | 'profile_incomplete'
  | 'billing_incomplete';

export interface PlanMensualGuardResult {
  allowed: boolean;
  reason?: PlanMensualBlockReason;
}

// Monthly subscriptions require a completed profile, billing readiness and a
// selected contracting entity. Holded is intentionally connected after payment
// as part of post-purchase onboarding.
export const MONTHLY_PLAN_SERVICE_IDS = new Set([
  'plan-supervision',
  'plan-avanzado',
  'plan-colaborativo',
  'svc_gestion_mensual',
  'svc_autonomo_gestion',
]);

export function isMonthlyPlanService(serviceId: string): boolean {
  return MONTHLY_PLAN_SERVICE_IDS.has(serviceId);
}

export async function canCheckoutMonthlyPlan(
  userId: string
): Promise<PlanMensualGuardResult> {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('profile_completed, billing_ready, active_company_id')
    .eq('id', userId)
    .single();

  if (!profile?.profile_completed) {
    return { allowed: false, reason: 'profile_incomplete' };
  }
  if (!profile.billing_ready) {
    return { allowed: false, reason: 'billing_incomplete' };
  }
  if (!profile.active_company_id) {
    return { allowed: false, reason: 'no_company' };
  }

  const { data: membership } = await admin
    .from('profile_companies')
    .select('id')
    .eq('profile_id', userId)
    .eq('company_id', profile.active_company_id)
    .maybeSingle();
  if (!membership) {
    return { allowed: false, reason: 'no_company' };
  }

  return { allowed: true };
}

export const PLAN_MENSUAL_BLOCK_MESSAGES: Record<PlanMensualBlockReason, string> = {
  no_company:          'Selecciona o crea la entidad fiscal que va a contratar el plan.',
  profile_incomplete:  'Completa tu perfil antes de contratar.',
  billing_incomplete:  'Añade tus datos de facturación antes de continuar.',
};

export const PLAN_MENSUAL_BLOCK_LINKS: Record<PlanMensualBlockReason, string> = {
  no_company:          '/dashboard/empresa/nueva',
  profile_incomplete:  '/dashboard/perfil',
  billing_incomplete:  '/dashboard/facturacion',
};