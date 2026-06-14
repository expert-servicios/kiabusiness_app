'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export function SecurityAlertResolveButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleResolve() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/security-alerts/${alertId}/resolve`, { method: 'POST' });
      if (!res.ok) { setFailed(true); return; }
      // alreadyResolved means another admin just resolved it — refresh shows updated state either way
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (failed) {
    return (
      <button
        onClick={handleResolve}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        <AlertCircle className="h-3 w-3" />
        Error — reintentar
      </button>
    );
  }

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
      Resolver
    </button>
  );
}
