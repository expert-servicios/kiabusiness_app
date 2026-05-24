import { Activity, Brain, BriefcaseBusiness, ShieldCheck, Server, Sparkles } from 'lucide-react';
import { getKiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';
import { KiaHealthOverview } from '@/components/admin/kia-health/KiaHealthOverview';
import { KiaHealthScoreCard } from '@/components/admin/kia-health/KiaHealthScoreCard';
import { KiaCanaryResults } from '@/components/admin/kia-health/KiaCanaryResults';
import { KiaBehaviorAnomalies } from '@/components/admin/kia-health/KiaBehaviorAnomalies';
import { KiaProviderStatus } from '@/components/admin/kia-health/KiaProviderStatus';
import { KiaCostLatencyChart } from '@/components/admin/kia-health/KiaCostLatencyChart';
import { KiaRunHistory } from '@/components/admin/kia-health/KiaRunHistory';

export const dynamic = 'force-dynamic';

export default async function KiaHealthPage() {
  const summary = await getKiaHealthSummary();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl space-y-5 px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">Observabilidad IA</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Kia Health</h1>
          <p className="mt-1 text-sm text-[#29384a]">Salud técnica, comportamiento, seguridad, coste y señales de negocio.</p>
        </div>

        <KiaHealthOverview summary={summary} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KiaHealthScoreCard title="General" score={summary.scores.overall} subtitle="Semáforo global" icon={Sparkles} />
          <KiaHealthScoreCard title="Técnico" score={summary.scores.technical} subtitle="APIs, Supabase, flags" icon={Server} />
          <KiaHealthScoreCard title="Comportamiento" score={summary.scores.behavioral} subtitle="Flujo, idioma, JSON" icon={Brain} />
          <KiaHealthScoreCard title="Seguridad" score={summary.scores.security} subtitle="Checkout, API keys, impuestos" icon={ShieldCheck} />
          <KiaHealthScoreCard title="Negocio" score={summary.scores.business} subtitle="Conversión y operación" icon={BriefcaseBusiness} />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <KiaCanaryResults failures={summary.recentFailures} />
            <KiaBehaviorAnomalies anomalies={summary.openAnomalies} />
          </div>
          <div className="space-y-5">
            <KiaProviderStatus summary={summary} />
            <KiaCostLatencyChart summary={summary} />
            <KiaRunHistory lastRun={summary.lastRun} />
          </div>
        </div>

        <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Acciones recomendadas</h2>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-[#29384a] md:grid-cols-2">
            <li>Si hay rojo crítico: revisar anomalía, decision log y apagar solo el canal afectado.</li>
            <li>Si hay warning de latencia: comprobar proveedor/fallback y coste por tokens.</li>
            <li>Si falla API key/checkout/impuestos: mantener `KIA_AI_TOOLS_ENABLED=false` y corregir prompt/regla.</li>
            <li>Si los canarios pasan: continuar friend-test en producción con logs activos.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
