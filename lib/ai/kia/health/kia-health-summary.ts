import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface KiaHealthSummary {
  currentStatus: 'green' | 'yellow' | 'red' | 'unknown';
  lastRun: {
    id: string;
    runType: string;
    status: string;
    score: number | null;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    startedAt: string;
    finishedAt: string | null;
    summary: string | null;
  } | null;
  scores: {
    overall: number | null;
    technical: number | null;
    behavioral: number | null;
    security: number | null;
    business: number | null;
  };
  openAnomalies: Array<{
    id: string;
    severity: string;
    anomalyType: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
  providerStatus: {
    provider: string | null;
    model: string | null;
    fallbackRate: number | null;
  };
  latency: {
    avgMs: number | null;
    p95Ms: number | null;
  };
  cost: {
    estimatedLastRun: number | null;
  };
  recentFailures: Array<{
    id: string;
    checkId: string;
    category: string;
    severity: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>;
}

export async function getKiaHealthSummary(): Promise<KiaHealthSummary> {
  const admin = getSupabaseAdmin();
  const [{ data: runs }, { data: anomalies }, { data: failures }] = await Promise.all([
    admin
      .from('kia_health_runs')
      .select('id, run_type, status, score, total_checks, passed_checks, failed_checks, warning_checks, provider, model, started_at, finished_at, summary')
      .order('started_at', { ascending: false })
      .limit(20),
    admin
      .from('kia_behavior_anomalies')
      .select('id, severity, anomaly_type, title, description, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('kia_health_check_results')
      .select('id, check_id, category, severity, status, error, created_at, latency_ms, cost_estimate, provider, model')
      .in('status', ['failed', 'warning'])
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const lastRun = runs?.[0] ?? null;
  const runIds = (runs ?? []).map((run: { id: string }) => run.id);
  const { data: recentResults } = runIds.length
    ? await admin
        .from('kia_health_check_results')
        .select('run_id, category, status, latency_ms, cost_estimate, provider, model')
        .in('run_id', runIds)
    : { data: [] };

  const results = recentResults ?? [];
  const criticalOpen = (anomalies ?? []).some((item: { severity: string }) => item.severity === 'critical');
  const currentStatus = !lastRun
    ? 'unknown'
    : criticalOpen || lastRun.status === 'failed'
      ? 'red'
      : lastRun.status === 'warning'
        ? 'yellow'
        : 'green';

  return {
    currentStatus,
    lastRun: lastRun ? {
      id: lastRun.id,
      runType: lastRun.run_type,
      status: lastRun.status,
      score: lastRun.score,
      totalChecks: lastRun.total_checks,
      passedChecks: lastRun.passed_checks,
      failedChecks: lastRun.failed_checks,
      warningChecks: lastRun.warning_checks,
      startedAt: lastRun.started_at,
      finishedAt: lastRun.finished_at,
      summary: lastRun.summary,
    } : null,
    scores: {
      overall: lastRun?.score ?? null,
      technical: scoreForCategory(results, 'technical'),
      behavioral: scoreForCategory(results, 'behavioral'),
      security: scoreForCategory(results, 'security'),
      business: scoreForCategory(results, 'business'),
    },
    openAnomalies: (anomalies ?? []).map((item: {
      id: string;
      severity: string;
      anomaly_type: string;
      title: string;
      description: string;
      created_at: string;
    }) => ({
      id: item.id,
      severity: item.severity,
      anomalyType: item.anomaly_type,
      title: item.title,
      description: item.description,
      createdAt: item.created_at,
    })),
    providerStatus: {
      provider: lastRun?.provider ?? null,
      model: lastRun?.model ?? null,
      fallbackRate: calculateFallbackRate(results),
    },
    latency: {
      avgMs: average(results.map((item: { latency_ms?: number | null }) => item.latency_ms).filter(isNumber)),
      p95Ms: percentile(results.map((item: { latency_ms?: number | null }) => item.latency_ms).filter(isNumber), 0.95),
    },
    cost: {
      estimatedLastRun: sum(results.map((item: { cost_estimate?: number | null }) => item.cost_estimate).filter(isNumber)),
    },
    recentFailures: (failures ?? []).map((item: {
      id: string;
      check_id: string;
      category: string;
      severity: string;
      status: string;
      error: string | null;
      created_at: string;
    }) => ({
      id: item.id,
      checkId: item.check_id,
      category: item.category,
      severity: item.severity,
      status: item.status,
      error: item.error,
      createdAt: item.created_at,
    })),
  };
}

function scoreForCategory(results: Array<{ category: string; status: string }>, category: string): number | null {
  const rows = results.filter((item) => item.category === category);
  if (rows.length === 0) return null;
  const score = rows.reduce((acc, item) => acc + (item.status === 'passed' ? 1 : item.status === 'warning' ? 0.5 : 0), 0) / rows.length;
  return Math.round(score * 100) / 100;
}

function calculateFallbackRate(results: Array<{ provider?: string | null }>): number | null {
  const providerRows = results.filter((item) => item.provider);
  if (providerRows.length === 0) return null;
  const openAiRows = providerRows.filter((item) => item.provider === 'openai').length;
  return Math.round((openAiRows / providerRows.length) * 100) / 100;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

function sum(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((acc, value) => acc + value, 0) * 1_000_000) / 1_000_000;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
