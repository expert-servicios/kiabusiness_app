'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';

type Mode = 'last_decision' | 'last_health' | 'manual';

export function KiaAuditorRunButton({ lastDecisionLogId, lastHealthRunId }: {
  lastDecisionLogId?: string;
  lastHealthRunId?: string;
}) {
  const router  = useRouter();
  const [loading, setLoading] = useState<Mode | null>(null);
  const [result, setResult]   = useState<{ status: string; score: number } | null>(null);
  const [error,  setError]    = useState<string | null>(null);

  async function run(mode: Mode, sourceId?: string, sourceType?: string) {
    setLoading(mode);
    setError(null);
    setResult(null);

    const body = sourceId && sourceType
      ? { sourceType, sourceId }
      : { sourceType: 'message', message: '(test)', kiaResponse: '(test)' };

    try {
      const res = await fetch('/api/admin/kia-auditor/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; review?: { overallStatus: string; score: number }; error?: string };
      if (!res.ok) { setError(data.error ?? 'Error'); return; }
      setResult({ status: data.review?.overallStatus ?? '?', score: data.review?.score ?? 0 });
      router.refresh();
    } catch {
      setError('Error de red');
    } finally {
      setLoading(null);
    }
  }

  const statusColor = result?.status === 'pass' ? 'text-emerald-700' : result?.status === 'fail' ? 'text-red-700' : 'text-amber-700';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lastDecisionLogId && (
        <button
          onClick={() => run('last_decision', lastDecisionLogId, 'decision_log')}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:border-[#c88b25] disabled:opacity-50 transition"
        >
          {loading === 'last_decision' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Auditar última decisión
        </button>
      )}
      {lastHealthRunId && (
        <button
          onClick={() => run('last_health', lastHealthRunId, 'health_check')}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:border-[#c88b25] disabled:opacity-50 transition"
        >
          {loading === 'last_health' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Auditar último health run
        </button>
      )}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
      {result && (
        <span className={`text-xs font-semibold ${statusColor}`}>
          {result.status.toUpperCase()} · {result.score}/100
        </span>
      )}
    </div>
  );
}
