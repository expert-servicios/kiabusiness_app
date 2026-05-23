import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProfitabilityRow {
  serviceId: string;
  period: string;
  revenueEur: number;
  totalMinutes: number;
  costEur: number;
  marginEur: number;
  marginPct: number;
  marginStatus: string;
}

export async function fetchProfitabilityMetrics(
  admin: SupabaseClient
): Promise<ProfitabilityRow[]> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Latest monthly snapshot per service_id
  const { data } = await admin
    .from('service_profitability_snapshots')
    .select('service_id, period, total_revenue_eur, total_minutes, total_cost_eur, margin_eur, margin_pct, margin_status')
    .eq('scope', 'monthly')
    .eq('period', currentMonth)
    .order('margin_pct', { ascending: true });

  if (!data || data.length === 0) {
    // Try last month if current month has no data yet
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString().slice(0, 7);
    const { data: prev } = await admin
      .from('service_profitability_snapshots')
      .select('service_id, period, total_revenue_eur, total_minutes, total_cost_eur, margin_eur, margin_pct, margin_status')
      .eq('scope', 'monthly')
      .eq('period', lastMonth)
      .order('margin_pct', { ascending: true });
    return (prev ?? []).map(mapRow);
  }

  return data.map(mapRow);
}

function mapRow(r: Record<string, unknown>): ProfitabilityRow {
  return {
    serviceId:    String(r.service_id ?? ''),
    period:       String(r.period     ?? ''),
    revenueEur:   Number(r.total_revenue_eur ?? 0),
    totalMinutes: Number(r.total_minutes     ?? 0),
    costEur:      Number(r.total_cost_eur    ?? 0),
    marginEur:    Number(r.margin_eur        ?? 0),
    marginPct:    Number(r.margin_pct        ?? 0),
    marginStatus: String(r.margin_status     ?? 'revisar_precio'),
  };
}
