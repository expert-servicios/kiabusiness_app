import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { fetchAuditorSummary } from '@/lib/ai/kia-auditor/kia-auditor-engine';
import { KIA_AUDITOR_RULES } from '@/lib/ai/kia-auditor/kia-auditor-rules';
import { KiaAuditorOverview } from '@/components/admin/kia-auditor/KiaAuditorOverview';
import { KiaAuditorReviewsList } from '@/components/admin/kia-auditor/KiaAuditorReviewsList';
import { KiaAuditorRuleMatrix } from '@/components/admin/kia-auditor/KiaAuditorRuleMatrix';
import { KiaAuditorRunButton } from '@/components/admin/kia-auditor/KiaAuditorRunButton';

export const dynamic = 'force-dynamic';

export default async function KiaAuditorPage() {
  const cookieStore = await cookies();
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

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [summary, ruleResultsRes, lastDecisionRes, lastHealthRes] = await Promise.all([
    fetchAuditorSummary(),
    admin
      .from('kia_auditor_rule_results')
      .select('rule_id, status')
      .gte('created_at', since),
    admin
      .from('kia_decision_logs')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('kia_health_runs')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Build rule stats
  const countsByRule = new Map<string, { passed: number; failed: number; warning: number }>();
  for (const r of ruleResultsRes.data ?? []) {
    const key = r.rule_id as string;
    const current = countsByRule.get(key) ?? { passed: 0, failed: 0, warning: 0 };
    if (r.status === 'passed') current.passed++;
    else if (r.status === 'failed') current.failed++;
    else if (r.status === 'warning') current.warning++;
    countsByRule.set(key, current);
  }

  const rulesWithStats = KIA_AUDITOR_RULES.map((rule) => {
    const counts  = countsByRule.get(rule.id) ?? { passed: 0, failed: 0, warning: 0 };
    const total   = counts.passed + counts.failed + counts.warning;
    const failRate = total > 0 ? Math.round((counts.failed / total) * 100) : null;
    return {
      id:       rule.id,
      label:    rule.label,
      category: rule.category,
      severity: rule.severity,
      evalType: rule.evaluationType,
      stats30d: { ...counts, total, failRate },
    };
  });

  const generatedAt = new Date().toLocaleString('es-ES', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-6xl space-y-5 px-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">Observabilidad IA</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Kia Auditor</h1>
            <p className="mt-1 text-xs text-[#29384a]">
              Revisión de calidad, comportamiento y cumplimiento de reglas · Actualizado el {generatedAt}
            </p>
          </div>
          <KiaAuditorRunButton
            lastDecisionLogId={lastDecisionRes.data?.id}
            lastHealthRunId={lastHealthRes.data?.id}
          />
        </div>

        {/* Overview */}
        <KiaAuditorOverview
          avgScore={summary.avgScore}
          totalReviews={summary.totalReviews}
          criticalFails={summary.criticalFails}
        />

        {/* Top failed rules */}
        {summary.topFailedRules.length > 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-3">Reglas más falladas (7 días)</p>
            <div className="flex flex-wrap gap-2">
              {summary.topFailedRules.map(({ ruleId, count }) => (
                <span key={ruleId} className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  {ruleId} ({count}×)
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Reviews list — wider */}
          <div className="lg:col-span-3">
            <KiaAuditorReviewsList reviews={summary.recentReviews as never} />
          </div>

          {/* Info panel */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Qué hace Kia Auditor</p>
              <ul className="space-y-1.5 text-xs text-[#29384a]">
                <li>→ Revisa decision logs, conversaciones y mensajes</li>
                <li>→ Aplica {KIA_AUDITOR_RULES.filter(r => r.evaluationType === 'deterministic').length} reglas deterministas automáticamente</li>
                <li>→ Usa LLM judge para {KIA_AUDITOR_RULES.filter(r => r.evaluationType === 'llm_judge').length} criterios cualitativos</li>
                <li>→ Crea anomalías en fallos críticos</li>
                <li>→ Genera NBA si hay riesgo alto</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Lo que NO hace</p>
              <ul className="space-y-1.5 text-xs text-[#29384a]">
                <li>✗ No responde a clientes</li>
                <li>✗ No ejecuta pagos ni acciones</li>
                <li>✗ No modifica expedientes</li>
                <li>✗ No guarda API keys ni secretos</li>
                <li>✗ No presenta impuestos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rule matrix */}
        <KiaAuditorRuleMatrix rules={rulesWithStats} />

      </div>
    </main>
  );
}
