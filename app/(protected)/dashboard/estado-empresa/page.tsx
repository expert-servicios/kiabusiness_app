import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { fetchQuarterData, currentQuarter, type QuarterSummary } from '@/lib/holded/quarter-data';
import { generateQuarterInsight } from '@/lib/holded/kia-insights';
import { QuarterSelector } from '@/components/dashboard/company-status/QuarterSelector';
import { VatSummaryCard } from '@/components/dashboard/company-status/VatSummaryCard';
import { SalesPurchasesChart } from '@/components/dashboard/company-status/SalesPurchasesChart';
import { PendingDocumentsCard } from '@/components/dashboard/company-status/PendingDocumentsCard';
import { AnomaliesCard } from '@/components/dashboard/company-status/AnomaliesCard';
import { ReconciliationCard } from '@/components/dashboard/company-status/ReconciliationCard';
import { KiaInsightsCard } from '@/components/dashboard/company-status/KiaInsightsCard';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function KpiBox({ label, value, isMoney = true }: { label: string; value: number; isMoney?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 text-center">
      <p className="text-xs text-[#29384a]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#07111d]">
        {isMoney ? fmt(value) : value}
      </p>
    </div>
  );
}

function RecentInvoicesCard({ data }: { data: QuarterSummary }) {
  const dateStr = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Emitidas */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
          Facturas emitidas ({data.salesCount})
        </p>
        {data.recentSales.length === 0 ? (
          <p className="text-xs text-[#29384a]">Sin facturas en este trimestre.</p>
        ) : (
          <div className="space-y-1.5">
            {data.recentSales.map((inv) => (
              <div key={inv.docNumber} className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#07111d]">{inv.docNumber}</span>
                <span className="text-[#29384a]">{inv.contact}</span>
                <span className="font-semibold text-[#07111d]">{fmt(inv.total)}</span>
                <span className="text-[#29384a]">{dateStr(inv.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Recibidas */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
          Facturas recibidas ({data.purchasesCount})
        </p>
        {data.recentPurchases.length === 0 ? (
          <p className="text-xs text-[#29384a]">Sin facturas en este trimestre.</p>
        ) : (
          <div className="space-y-1.5">
            {data.recentPurchases.map((inv) => (
              <div key={inv.docNumber} className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#07111d]">{inv.docNumber}</span>
                <span className="text-[#29384a]">{inv.contact}</span>
                <span className="font-semibold text-[#07111d]">{fmt(inv.total)}</span>
                <span className="text-[#29384a]">{dateStr(inv.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gate views ────────────────────────────────────────────────────────────────

function UpsellView() {
  return (
    <main className="min-h-screen bg-[#f8f4eb] py-16">
      <div className="mx-auto max-w-lg px-6 text-center">
        <p className="text-4xl">📊</p>
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#07111d]">Estado de empresa</h1>
        <p className="mt-3 text-[#29384a]">
          Este panel está disponible para clientes con <strong>plan mensual de gestión</strong>. Incluye resumen fiscal trimestral, análisis de IVA y seguimiento de facturas.
        </p>
        <Link
          href="/servicios"
          className="mt-6 inline-block rounded-xl bg-[#c88b25] px-6 py-3 text-sm font-bold text-white hover:bg-[#a97320] transition"
        >
          Ver planes
        </Link>
      </div>
    </main>
  );
}

function ConnectHoldedView() {
  return (
    <main className="min-h-screen bg-[#f8f4eb] py-16">
      <div className="mx-auto max-w-lg px-6 text-center">
        <p className="text-4xl">🔗</p>
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#07111d]">Conecta Holded</h1>
        <p className="mt-3 text-[#29384a]">
          Para ver tu estado de empresa necesitas conectar Holded. Es rápido — solo necesitas tu API key de Holded.
        </p>
        <Link
          href="/dashboard/integraciones/holded"
          className="mt-6 inline-block rounded-xl bg-[#c88b25] px-6 py-3 text-sm font-bold text-white hover:bg-[#a97320] transition"
        >
          Conectar Holded
        </Link>
      </div>
    </main>
  );
}

function HoldedErrorView() {
  return (
    <main className="min-h-screen bg-[#f8f4eb] py-16">
      <div className="mx-auto max-w-lg px-6 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#07111d]">Error de conexión con Holded</h1>
        <p className="mt-3 text-[#29384a]">
          Tu integración con Holded tiene un error. Revísala para restablecer la conexión.
        </p>
        <Link
          href="/dashboard/integraciones/holded"
          className="mt-6 inline-block rounded-xl bg-[#c88b25] px-6 py-3 text-sm font-bold text-white hover:bg-[#a97320] transition"
        >
          Ver integración
        </Link>
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function EstadoEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const cookieStore = await cookies();
  const sp = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();

  // Gate 1: monthly plan
  const { data: profile } = await admin
    .from('profiles')
    .select('has_monthly_plan')
    .eq('id', user.id)
    .single();

  if (!profile?.has_monthly_plan) return <UpsellView />;

  // Gate 2: Holded active
  const { data: integration } = await admin
    .from('client_integrations')
    .select('id, status, last_sync_at')
    .eq('client_id', user.id)
    .eq('provider', 'holded')
    .neq('status', 'revoked')
    .maybeSingle();

  if (!integration)                      return <ConnectHoldedView />;
  if (integration.status !== 'active')   return <HoldedErrorView />;

  // Quarter params
  const now     = currentQuarter();
  const year    = parseInt(sp.year    ?? String(now.year),    10);
  const quarter = (parseInt(sp.quarter ?? String(now.quarter), 10) || now.quarter) as 1 | 2 | 3 | 4;

  // Fetch Holded + DB data in parallel
  let quarterData: QuarterSummary | null = null;
  let fetchError = false;

  const [qResult, pendingDocsResult, anomaliesResult] = await Promise.allSettled([
    fetchQuarterData(integration.id, year, quarter),
    admin
      .from('document_classifications')
      .select('id, detected_type, extracted_data, created_at')
      .eq('client_id', user.id)
      .eq('status', 'needs_review')
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('next_best_actions')
      .select('id, title, description, priority, created_at')
      .eq('client_id', user.id)
      .eq('action_type', 'review_anomaly')
      .eq('status', 'open')
      .in('priority', ['media', 'alta', 'critica'])
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (qResult.status === 'fulfilled') {
    quarterData = qResult.value;
  } else {
    console.error('[EstadoEmpresa] Holded fetch failed', qResult.reason);
    fetchError = true;
  }

  const pendingDocs = pendingDocsResult.status === 'fulfilled'
    ? (pendingDocsResult.value.data ?? [])
    : [];
  const anomalies   = anomaliesResult.status === 'fulfilled'
    ? (anomaliesResult.value.data ?? [])
    : [];

  // Kia insight (non-blocking, only if we have data)
  const kiaInsight = quarterData ? await generateQuarterInsight(quarterData).catch(() => null) : null;

  // Sync age warning
  const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
  const syncAgeH = lastSync ? (Date.now() - lastSync.getTime()) / 3_600_000 : null;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-5xl space-y-4 px-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">Plan mensual</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Estado de empresa</h1>
          </div>
          <QuarterSelector currentYear={year} currentQuarter={quarter} />
        </div>

        {/* Warnings */}
        {syncAgeH !== null && syncAgeH > 48 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ Datos desactualizados — última sincronización hace {Math.round(syncAgeH)} h.{' '}
            <Link href="/dashboard/integraciones/holded" className="underline">Actualizar</Link>
          </div>
        )}

        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            ❌ No se pudieron obtener los datos de Holded en este momento.{' '}
            <Link href="/dashboard/integraciones/holded" className="underline">Revisa tu integración</Link>
          </div>
        )}

        {/* Data blocks */}
        {quarterData && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiBox label="Ventas" value={quarterData.salesTotal} />
              <KpiBox label="Gastos" value={quarterData.purchasesTotal} />
              <KpiBox label="Facturas emitidas" value={quarterData.salesCount} isMoney={false} />
              <KpiBox label="Facturas recibidas" value={quarterData.purchasesCount} isMoney={false} />
            </div>

            <VatSummaryCard
              vatRepercutido={quarterData.vatRepercutido}
              vatSoportado={quarterData.vatSoportado}
              vatResult={quarterData.vatResult}
            />

            <SalesPurchasesChart monthlyData={quarterData.monthlyData} />

            <RecentInvoicesCard data={quarterData} />

            <KiaInsightsCard insight={kiaInsight} />
          </>
        )}

        {/* Always shown */}
        <PendingDocumentsCard documents={pendingDocs} />
        <AnomaliesCard anomalies={anomalies} />
        <ReconciliationCard />

        {/* Legal */}
        <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-5 py-4 text-xs text-[#29384a]">
          <p className="font-semibold text-[#07111d]">Aviso importante</p>
          <p className="mt-1">
            Resumen estimado generado a partir de datos sincronizados con Holded. Pendiente de revisión profesional antes de presentar cualquier declaración. EXPERT no modifica tu contabilidad sin confirmación explícita.
          </p>
        </div>

      </div>
    </main>
  );
}
