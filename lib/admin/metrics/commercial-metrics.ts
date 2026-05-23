import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommercialMetrics {
  leadsNuevos7d: number;
  leadsCalientes: number;
  checkoutsPendientes: number;
  checkoutsAbandonados24h: number;
  serviciosContratadosSemana: number;
  serviciosContratadosMes: number;
}

export async function fetchCommercialMetrics(
  admin: SupabaseClient
): Promise<CommercialMetrics> {
  const now     = new Date();
  const ago7d   = new Date(now.getTime() - 7  * 86_400_000).toISOString();
  const ago30d  = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const ago24h  = new Date(now.getTime() - 24 * 3_600_000).toISOString();

  const [
    leads7d, leadsCalientes,
    checkoutsPend, checkoutsAbandoned,
    cases7d, cases30d,
  ] = await Promise.all([
    admin.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', ago7d),
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('state', 'contacted'),
    admin.from('checkout_sessions').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
    admin.from('checkout_sessions').select('id', { count: 'exact', head: true }).neq('status', 'completed').lt('created_at', ago24h),
    admin.from('cases').select('id', { count: 'exact', head: true }).gte('opened_at', ago7d),
    admin.from('cases').select('id', { count: 'exact', head: true }).gte('opened_at', ago30d),
  ]);

  return {
    leadsNuevos7d:           leads7d.count         ?? 0,
    leadsCalientes:          leadsCalientes.count   ?? 0,
    checkoutsPendientes:     checkoutsPend.count    ?? 0,
    checkoutsAbandonados24h: checkoutsAbandoned.count ?? 0,
    serviciosContratadosSemana: cases7d.count      ?? 0,
    serviciosContratadosMes:    cases30d.count      ?? 0,
  };
}
