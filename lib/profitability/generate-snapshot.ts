import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const COST_PER_MINUTE_EUR = 0.50;

function computeMarginStatus(revenueEur: number, costEur: number): string {
  if (revenueEur <= 0) return costEur > 0 ? 'perdida' : 'revisar_precio';
  const pct = ((revenueEur - costEur) / revenueEur) * 100;
  if (pct >= 40) return 'rentable';
  if (pct >= 20) return 'ajustado';
  if (pct >= 0)  return 'revisar_precio';
  return 'perdida';
}

/**
 * Generate or update a 'case' scope snapshot for a specific case.
 * Called when a case reaches 'finalizado' status.
 */
export async function generateCaseSnapshot(caseId: string): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: events, error: eventsErr } = await admin
    .from('service_profitability_events')
    .select('estimated_minutes, service_id')
    .eq('case_id', caseId);

  if (eventsErr) {
    console.error('[generateCaseSnapshot] events query error', eventsErr.message);
    return;
  }

  if (!events || events.length === 0) return;

  const totalMinutes  = events.reduce((s, e) => s + (e.estimated_minutes ?? 0), 0);
  const totalCostEur  = parseFloat((totalMinutes * COST_PER_MINUTE_EUR).toFixed(2));
  const serviceId     = events[0].service_id ?? 'unknown';

  // Look up order revenue linked to this case via metadata
  const { data: orders } = await admin
    .from('orders')
    .select('amount_eur, amount')
    .eq('metadata->>case_id', caseId)
    .in('status', ['paid', 'active', 'complete']);

  const revenueEur = parseFloat(
    (orders ?? [])
      .reduce((s, o) => s + (o.amount_eur != null ? Number(o.amount_eur) : Number(o.amount ?? 0)), 0)
      .toFixed(2)
  );

  const marginStatus = computeMarginStatus(revenueEur, totalCostEur);

  // Check if snapshot already exists for this case
  const { data: existing } = await admin
    .from('service_profitability_snapshots')
    .select('id')
    .eq('case_id', caseId)
    .eq('scope', 'case')
    .maybeSingle();

  if (existing) {
    await admin
      .from('service_profitability_snapshots')
      .update({
        service_id:        serviceId,
        period:            new Date().toISOString().slice(0, 7),
        total_revenue_eur: revenueEur,
        total_minutes:     totalMinutes,
        total_cost_eur:    totalCostEur,
        margin_status:     marginStatus,
        generated_at:      new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    const { error } = await admin
      .from('service_profitability_snapshots')
      .insert({
        case_id:           caseId,
        service_id:        serviceId,
        scope:             'case',
        period:            new Date().toISOString().slice(0, 7),
        total_revenue_eur: revenueEur,
        total_minutes:     totalMinutes,
        total_cost_eur:    totalCostEur,
        margin_status:     marginStatus,
        generated_at:      new Date().toISOString(),
      });
    if (error) console.error('[generateCaseSnapshot] insert error', error.message);
  }
}

/**
 * Generate or update monthly scope snapshots for all services in a given period.
 * Groups events by service_id and aggregates revenue from orders closed that month.
 */
export async function generateMonthlySnapshots(period?: string): Promise<{ services: number; error?: string }> {
  const admin = getSupabaseAdmin();
  const targetPeriod = period ?? new Date().toISOString().slice(0, 7);
  const periodStart  = `${targetPeriod}-01T00:00:00.000Z`;
  const periodEnd    = new Date(new Date(`${targetPeriod}-01`).setMonth(
    new Date(`${targetPeriod}-01`).getMonth() + 1
  )).toISOString();

  const { data: events, error: eventsErr } = await admin
    .from('service_profitability_events')
    .select('service_id, estimated_minutes')
    .gte('created_at', periodStart)
    .lt('created_at', periodEnd);

  if (eventsErr) return { services: 0, error: eventsErr.message };

  // Group by service_id
  const byService = new Map<string, number>();
  for (const e of events ?? []) {
    const svcId = e.service_id ?? 'unknown';
    byService.set(svcId, (byService.get(svcId) ?? 0) + (e.estimated_minutes ?? 0));
  }

  if (byService.size === 0) return { services: 0 };

  // Aggregate order revenue by service slug for the period
  const { data: orders } = await admin
    .from('orders')
    .select('amount_eur, amount, service_slugs')
    .gte('created_at', periodStart)
    .lt('created_at', periodEnd)
    .in('status', ['paid', 'active', 'complete']);

  const revenueByService = new Map<string, number>();
  for (const order of orders ?? []) {
    const rev   = order.amount_eur != null ? Number(order.amount_eur) : Number(order.amount ?? 0);
    const slugs: string[] = Array.isArray(order.service_slugs)
      ? order.service_slugs
      : (order.service_slugs ? [order.service_slugs] : ['unknown']);
    const perSlug = slugs.length > 0 ? rev / slugs.length : 0;
    for (const slug of slugs) {
      revenueByService.set(slug, (revenueByService.get(slug) ?? 0) + perSlug);
    }
  }

  let count = 0;
  for (const [serviceId, totalMinutes] of byService) {
    const totalCostEur  = parseFloat((totalMinutes * COST_PER_MINUTE_EUR).toFixed(2));
    const revenueEur    = parseFloat((revenueByService.get(serviceId) ?? 0).toFixed(2));
    const marginStatus  = computeMarginStatus(revenueEur, totalCostEur);

    // Supabase upsert on the partial unique index (service_id, period, scope WHERE scope='monthly')
    const { error } = await admin
      .from('service_profitability_snapshots')
      .upsert(
        {
          service_id:        serviceId,
          scope:             'monthly',
          period:            targetPeriod,
          case_id:           null,
          total_revenue_eur: revenueEur,
          total_minutes:     totalMinutes,
          total_cost_eur:    totalCostEur,
          margin_status:     marginStatus,
          generated_at:      new Date().toISOString(),
        },
        { onConflict: 'service_id,period,scope' }
      );

    if (error) console.error(`[generateMonthlySnapshots] ${serviceId}`, error.message);
    else count++;
  }

  return { services: count };
}
