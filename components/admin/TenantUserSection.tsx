'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Trash2, User } from 'lucide-react';

interface TenantUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export function TenantUserSection({
  tenantId,
  initialUsers,
}: {
  tenantId: string;
  initialUsers: TenantUser[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al asignar usuario'); return; }
      setEmail('');
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (userId: string) => {
    setRemoving(userId);
    try {
      await fetch(`/api/admin/tenants/${tenantId}/users?userId=${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Assign form */}
      <form onSubmit={assign} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@asesoria.com"
          className="flex-1 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7a33a] bg-[#d7a33a]/10 px-4 py-2.5 text-sm font-semibold text-[#d7a33a] transition hover:bg-[#d7a33a]/20 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? 'Asignando…' : 'Asignar'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-6 text-center text-sm text-[#29384a]/60">
          Ningún usuario asignado a este tenant todavía.
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-[#d8cbb5] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f4eb]">
                  <User className="h-4 w-4 text-[#d7a33a]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{u.full_name ?? u.email ?? 'Usuario'}</p>
                  {u.full_name && u.email && <p className="text-xs text-[#29384a]">{u.email}</p>}
                  <p className="text-[10px] font-semibold uppercase text-[#29384a]/50">{u.role}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={removing === u.id}
                onClick={() => remove(u.id)}
                className="rounded-lg p-1.5 text-[#29384a]/40 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Eliminar del tenant"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
