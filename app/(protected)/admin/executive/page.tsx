import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { Activity } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getKiaHealthSummary }      from '@/lib/ai/kia/health/kia-health-summary';
import { fetchAuditorSummary }      from '@/lib/ai/kia-auditor/kia-auditor-engine';
import { fetchCommercialMetrics }   from '@/lib/admin/metrics/commercial-metrics';
import { fetchOperationalMetrics }  from '@/lib/admin/metrics/operational-metrics';
import { fetchFiscalMetrics }       from '@/lib/admin/metrics/fiscal-metrics';
import { fetchCommunicationMetrics } from '@/lib/admin/metrics/communication-metrics';
import { fetchProfitabilityMetrics } from '@/lib/admin/metrics/profitability-metrics';
import { runNbaTriggers }            from '@/lib/nba/nba-triggers';
import { CommercialSummary }        from '@/components/admin/executive/CommercialSummary';
import { OperationsSummary }        from '@/components/admin/executive/OperationsSummary';
import { FiscalAccountingSummary }  from '@/components/admin/executive/FiscalAccountingSummary';
import { CommunicationSummary }     from '@/components/admin/executive/CommunicationSummary';
import { ProfitabilitySummary }     from '@/components/admin/executive/ProfitabilitySummary';
import { NextBestActions }          from '@/components/admin/executive/NextBestActions';
import type { NbaItem }             from '@/components/admin/executive/NextBestActions';
import { RefreshButton }            from '@/components/admin/executive/RefreshButton';

export default async function ExecutivePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();

  // Verify staff role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Run NBA triggers (idempotent) — ensures open actions are up to date
  await runNbaTriggers().catch(() => {}); // non-blocking on error

  // Fetch all metrics in parallel
  const [commercial, operational, fiscal, communication, profitability] = await Promise.all([
    fetchCommercialMetrics(admin),
    fetchOperationalMetrics(admin),
    fetchFiscalMetrics(admin),
    fetchCommunicationMetrics(admin),
    fetchProfitabilityMetrics(admin),
  ]);
  const [kiaHealth, auditorSummary] = await Promise.all([
    getKiaHealthSummary().catch(() => null),
    fetchAuditorSummary().catch(() => null),
  ]);

  // Fetch open NBAs ordered by priority
  const { data: rawNbas } = await admin
    .from('next_best_actions')
    .select(`
      id, action_type, priority, title, description, due_at, created_at,
      client:profiles!client_id(id, full_name, email),
      case:cases!case_id(id, service)
    `)
    .eq('status', 'open')
    .order('priority', { ascending: false })
    .order('due_at',   { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(30);

  const nbas = (rawNbas ?? []) as unknown as NbaItem[];

  const generatedAt = new Date().toLocaleString('es-ES', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-6xl space-y-4 px-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">Vista completa</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Panel Gerente</h1>
            <p className="mt-1 text-xs text-[#29384a]">Actualizado el {generatedAt}</p>
          </div>
          <RefreshButton />
        </div>

        {/* 4-column KPI blocks */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CommercialSummary   data={commercial}    />
          <OperationsSummary   data={operational}   />
          <FiscalAccountingSummary data={fiscal}    />
          <CommunicationSummary   data={communication} />
        </div>

        {/* Profitability */}
        <ProfitabilitySummary data={profitability} />

        {kiaHealth && (
          <Link
            href="/admin/kia-health"
            className={`flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
              kiaHealth.currentStatus === 'red'
                ? 'border-red-200 bg-red-50'
                : kiaHealth.currentStatus === 'yellow'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/70 p-2">
                <Activity className="h-4 w-4 text-[#c88b25]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Kia Health</p>
                <p className="mt-1 text-sm font-semibold text-[#07111d]">
                  {kiaHealth.lastRun?.summary ?? 'Sin canary ejecutado todavía'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-[#07111d]">
              {kiaHealth.currentStatus}
            </span>
          </Link>
        )}

        {/* Kia Auditor widget */}
        {auditorSummary && (
          <Link
            href="/admin/kia-auditor"
            className={`flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
              auditorSummary.criticalFails > 0
                ? 'border-red-200 bg-red-50'
                : auditorSummary.avgScore >= 80
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/70 p-2">
                <Activity className="h-4 w-4 text-[#c88b25]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Kia Auditor</p>
                <p className="mt-1 text-sm font-semibold text-[#07111d]">
                  Score medio: {auditorSummary.avgScore}/100 · {auditorSummary.totalReviews} revisiones · {auditorSummary.criticalFails} fallos críticos
                </p>
              </div>
            </div>
            <span className={`rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase ${
              auditorSummary.criticalFails > 0 ? 'text-red-700' : auditorSummary.avgScore >= 80 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {auditorSummary.criticalFails > 0 ? 'FALLOS' : auditorSummary.avgScore >= 80 ? 'OK' : 'AVISOS'}
            </span>
          </Link>
        )}

        {/* NBAs */}
        <NextBestActions initialItems={nbas} />

      </div>
    </main>
  );
}
