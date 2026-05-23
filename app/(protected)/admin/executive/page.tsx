import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
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

        {/* NBAs */}
        <NextBestActions initialItems={nbas} />

      </div>
    </main>
  );
}
