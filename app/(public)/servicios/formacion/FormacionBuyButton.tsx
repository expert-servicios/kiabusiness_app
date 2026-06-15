'use client';

import { useState } from 'react';
import { CalendlyButton } from '@/components/site/CalendlyButton';
import { getCalendlyMeetingUrl } from '@/lib/utils/calendly';

const PRICE_ID = 'price_1SyB8ULeYwwgvux4sZbYod1B';
const CALENDLY_URL = getCalendlyMeetingUrl();

export function FormacionBuyButton({ area }: { area: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/holded/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICE_ID, packageName: `Formación: ${area}` })
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? 'No se pudo iniciar el pago.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <CalendlyButton
        url={CALENDLY_URL}
        title="Consulta gratuita"
        subtitle="15 minutos · Sin compromiso"
        className="inline-flex w-full items-center justify-center border border-[#D4A017] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
      >
        Consulta gratuita 15 min
      </CalendlyButton>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center bg-[#D4A017] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {loading ? 'Redirigiendo...' : 'Reservar sesión — 180 €'}
      </button>
      {error && <p className="text-center text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
