'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Play } from 'lucide-react';

export function KiaHealthRunButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      await fetch('/api/admin/kia/health/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runType: 'manual' }),
      });
      router.refresh();
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={running}
      className="inline-flex items-center gap-2 rounded-lg bg-[#07111d] px-4 py-2 text-xs font-semibold text-[#d7a33a] transition hover:bg-[#0d1f35] disabled:cursor-wait disabled:opacity-60"
    >
      <Play className="h-3.5 w-3.5" />
      {running ? 'Ejecutando...' : 'Ejecutar canary ahora'}
    </button>
  );
}
