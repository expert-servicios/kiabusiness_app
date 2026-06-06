'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tenant: {
    id: string;
    name: string;
    domain: string | null;
    plan: 'starter' | 'pro' | 'enterprise';
    active: boolean;
  };
}

export function TenantEditForm({ tenant }: Props) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [domain, setDomain] = useState(tenant.domain ?? '');
  const [plan, setPlan] = useState(tenant.plan);
  const [active, setActive] = useState(tenant.active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || null,
          plan,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="t-name">Nombre</label>
        <input
          id="t-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="t-domain">
          Dominio <span className="font-normal text-[#29384a]">(opcional)</span>
        </label>
        <input
          id="t-domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="asesoria.com"
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Plan</label>
        <div className="flex gap-3">
          {(['starter', 'pro', 'enterprise'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition ${
                plan === p
                  ? 'border-[#d7a33a] bg-[#d7a33a]/10 text-[#d7a33a]'
                  : 'border-[#d8cbb5] text-[#29384a] hover:border-[#d7a33a]/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded accent-[#d7a33a]"
        />
        <span className="text-sm text-[#29384a]">Tenant activo</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Guardado correctamente.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#d7a33a] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
