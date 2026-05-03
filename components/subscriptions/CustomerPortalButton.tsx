'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function CustomerPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/customer-portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'No se pudo acceder al portal');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Error al conectar con el portal de facturación.');
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
        className="inline-flex items-center gap-2 rounded-full bg-[#061321] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#F8F6F1] transition hover:bg-[#1a2e44] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <ExternalLink className="h-4 w-4" />
        {loading ? 'Redirigiendo...' : 'Gestionar suscripción'}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
