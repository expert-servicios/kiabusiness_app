'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';

interface Props {
  priceId: string;
  label: string;
}

export function SubscriptionCheckoutButton({ priceId, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'No se pudo iniciar el pago');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Error al iniciar el proceso de pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Zap className="h-4 w-4" />
        {loading ? 'Procesando...' : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
