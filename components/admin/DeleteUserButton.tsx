'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface Props {
  userId: string;
  userEmail: string;
  disabledReason?: string | null;
}

export function DeleteUserButton({ userId, userEmail, disabledReason }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const disabled = Boolean(disabledReason) || loading;

  const handleDelete = async () => {
    if (disabledReason || loading) return;

    const confirmed = window.confirm(
      `Eliminar usuario ${userEmail || userId}?\n\nEsta accion borra el acceso de Supabase Auth. Usala solo para usuarios spam sin actividad real.`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo eliminar el usuario.');
        return;
      }

      router.refresh();
    } catch {
      setMessage('Error de conexion al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled}
        title={disabledReason ?? 'Eliminar usuario spam'}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-[#d8cbb5] disabled:bg-[#f8f4eb] disabled:text-[#9ca3af]"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading ? 'Eliminando...' : 'Eliminar'}
      </button>
      {message ? <p className="max-w-[180px] text-xs leading-5 text-red-700">{message}</p> : null}
      {disabledReason ? <p className="max-w-[180px] text-xs leading-5 text-[#9ca3af]">{disabledReason}</p> : null}
    </div>
  );
}
