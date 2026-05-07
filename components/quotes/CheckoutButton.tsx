'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  quoteId: string;
}

export function CheckoutButton({ quoteId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error || 'No se pudo iniciar el pago');
        setLoading(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError('Error al conectar con Stripe');
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-[#c88b25] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Redirigiendo...' : 'Pagar presupuesto'}
      </button>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
