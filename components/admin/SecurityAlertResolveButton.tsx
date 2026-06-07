'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function SecurityAlertResolveButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    setLoading(true);
    try {
      await fetch(`/api/admin/security-alerts/${alertId}/resolve`, { method: 'POST' });
      router.refresh();
    } finally {
      setLoading(false);
    }
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
