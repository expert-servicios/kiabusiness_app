import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type PlanMensualBlockReason =
  | 'no_holded'
  | 'holded_error'
  | 'profile_incomplete'
  | 'billing_incomplete';

export interface PlanMensualGuardResult {
  allowed: boolean;
  reason?: PlanMensualBlockReason;
}

// Service IDs that require an active Holded integration before checkout
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
  if (!profile?.billing_ready) {
    return { allowed: false, reason: 'billing_incomplete' };
  }

  let integrationQuery = admin
    .from('client_integrations')
    .select('status')
    .eq('provider', 'holded')
    .neq('status', 'revoked')
    .limit(1);

  if (profile?.active_company_id) {
    integrationQuery = integrationQuery.or(`client_id.eq.${userId},company_id.eq.${profile.active_company_id}`);
  } else {
    integrationQuery = integrationQuery.eq('client_id', userId);
  }

  const { data: integrations } = await integrationQuery;
  const integration = integrations?.[0] ?? null;

  if (!integration) {
    return { allowed: false, reason: 'no_holded' };
  }
  if (integration.status !== 'active') {
    return { allowed: false, reason: 'holded_error' };
  }

  return { allowed: true };
}

export const PLAN_MENSUAL_BLOCK_MESSAGES: Record<PlanMensualBlockReason, string> = {
  no_holded:           'Para contratar el plan mensual necesitas conectar Holded.',
  holded_error:        'Tu conexión con Holded tiene un error. Revísala antes de continuar.',
  profile_incomplete:  'Completa tu perfil antes de contratar.',
  billing_incomplete:  'Añade tus datos de facturación antes de continuar.',
};

export const PLAN_MENSUAL_BLOCK_LINKS: Record<PlanMensualBlockReason, string> = {
  no_holded:           '/dashboard/integraciones/holded',
  holded_error:        '/dashboard/integraciones/holded',
  profile_incomplete:  '/dashboard/perfil',
  billing_incomplete:  '/dashboard/facturacion',
};
