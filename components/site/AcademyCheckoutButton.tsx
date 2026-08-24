'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';

export function AcademyCheckoutButton({ programSlug, className }: { programSlug: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/academy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programSlug }),
      });

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/academy`);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (data.profileRequired) {
        router.push('/dashboard/perfil?redirect=/academy');
        return;
      }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'No se pudo iniciar el pago. Inténtalo de nuevo.');
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
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
        className={className}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {loading ? 'Procesando...' : 'Matricularme ahora'}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
