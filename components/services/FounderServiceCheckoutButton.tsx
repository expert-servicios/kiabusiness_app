'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { FounderServiceSlug } from '@/lib/services/founder-services';

type Props = {
  slug: FounderServiceSlug;
  quantity?: number;
  label: string;
  className?: string;
};

export function FounderServiceCheckoutButton({ slug, quantity = 1, label, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/founder-services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, quantity }),
      });
      const data = await res.json().catch(() => ({}));

      const next = window.location.pathname;
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
        return;
      }
      if (res.status === 409 && data.code === 'profile_required') {
        window.location.href = `/dashboard/perfil?redirect=${encodeURIComponent(next)}`;
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo iniciar el pago.');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago.');
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={className ?? 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60'}
      >
        <ShoppingBag className="h-4 w-4" />
        {loading ? 'Preparando pago…' : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
