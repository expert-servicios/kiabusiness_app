import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { GenerateSnapshotButton } from '@/components/admin/rentabilidad/GenerateSnapshotButton';
import { ProfitabilityTable } from '@/components/admin/rentabilidad/ProfitabilityTable';
import { EventsBreakdown } from '@/components/admin/rentabilidad/EventsBreakdown';

export default async function RentabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const cookieStore = await cookies();
  const { period: qPeriod } = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'owner'].includes(profile.role)) redirect('/dashboard');

  // Default to current month
  const now = new Date();
  const currentPeriod = now.toISOString().slice(0, 7);
  const period = qPeriod ?? currentPeriod;

  // Build list of last 6 months for selector
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  // Fetch snapshots for the selected period (monthly scope)
  const { data: snapshots } = await admin
    .from('service_profitability_snapshots')
    .select('service_id, period, total_revenue_eur, total_minutes, total_cost_eur, margin_eur, margin_pct, margin_status, generated_at')
    .eq('scope', 'monthly')
    .eq('period', period)
    .order('margin_pct', { ascending: true });

  // Fetch recent events breakdown (last 30 days)
  const periodStart = `${period}-01T00:00:00.000Z`;
  const periodEnd   = new Date(new Date(`${period}-01`).setMonth(
    new Date(`${period}-01`).getMonth() + 1
  )).toISOString();

  const { data: events } = await admin
    .from('service_profitability_events')
    .select('event_type, estimated_minutes, operator, service_id, created_at')
    .gte('created_at', periodStart)
    .lt('created_at', periodEnd)
    .order('created_at', { ascending: false })
    .limit(200);

  // Aggregate events by type for breakdown
  const byType = new Map<string, { count: number; minutes: number }>();
  for (const e of events ?? []) {
    const key = e.event_type as string;
    const existing = byType.get(key) ?? { count: 0, minutes: 0 };
    existing.count   += 1;
    existing.minutes += e.estimated_minutes ?? 0;
    byType.set(key, existing);
  }
  const eventBreakdown = Array.from(byType.entries())
    .map(([type, { count, minutes }]) => ({ type, count, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  // Summary totals
  const totalRevenue = (snapshots ?? []).reduce((s, r) => s + Number(r.total_revenue_eur ?? 0), 0);
  const totalCost    = (snapshots ?? []).reduce((s, r) => s + Number(r.total_cost_eur    ?? 0), 0);
  const totalMargin  = totalRevenue - totalCost;
  const totalMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const generatedAt = now.toLocaleString('es-ES', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">Análisis económico</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Rentabilidad</h1>
            <p className="mt-1 text-xs text-[#29384a]">Actualizado el {generatedAt}</p>
          </div>
          <GenerateSnapshotButton period={period} />
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {months.map((m) => (
            <a
              key={m}
              href={`?period=${m}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                m === period
                  ? 'bg-[#07111d] text-white'
                  : 'bg-white border border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
              }`}
            >
              {new Date(`${m}-01`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </a>
          ))}
        </div>

        {/* KPI summary row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryKpi
            label="Ingresos"
            value={`${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            color="text-emerald-700"
          />
          <SummaryKpi
            label="Coste estimado"
            value={`${totalCost.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            color="text-amber-700"
          />
          <SummaryKpi
            label="Margen"
            value={`${totalMargin >= 0 ? '+' : ''}${totalMargin.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € (${totalMarginPct.toFixed(1)}%)`}
            color={totalMarginPct >= 20 ? 'text-emerald-700' : totalMarginPct >= 0 ? 'text-amber-700' : 'text-red-700'}
          />
        </div>

        {/* Snapshots table */}
        <ProfitabilityTable snapshots={snapshots ?? []} period={period} />

        {/* Events breakdown */}
        <EventsBreakdown breakdown={eventBreakdown} totalMinutes={(events ?? []).reduce((s, e) => s + (e.estimated_minutes ?? 0), 0)} />

      </div>
    </main>
  );
}

function SummaryKpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
