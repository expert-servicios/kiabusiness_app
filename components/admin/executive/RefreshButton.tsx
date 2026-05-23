'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    router.refresh();
    // Give the router time to settle before removing spinner
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <button
      onClick={refresh}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] shadow-sm hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-50 transition"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Actualizando…' : 'Actualizar'}
    </button>
  );
}
