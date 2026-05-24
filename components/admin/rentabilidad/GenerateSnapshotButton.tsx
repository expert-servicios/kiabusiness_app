'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function GenerateSnapshotButton({ period }: { period: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  async function generate() {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/admin/profitability/generate-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) router.refresh();
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status === 'ok' && (
        <span className="text-xs font-semibold text-emerald-700">Snapshot generado</span>
      )}
      {status === 'error' && (
        <span className="text-xs font-semibold text-red-600">Error al generar</span>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] shadow-sm hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-50 transition"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Calculando…' : 'Recalcular'}
      </button>
    </div>
  );
}
