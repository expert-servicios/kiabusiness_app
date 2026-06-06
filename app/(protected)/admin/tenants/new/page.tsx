'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    // Auto-generate slug from name if user hasn't edited slug manually
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), domain: domain.trim() || undefined, plan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al crear el tenant'); return; }
      router.push(`/admin/tenants/${data.tenant.id}`);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/tenants" className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d5]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Nuevo tenant</h1>
          <p className="text-sm text-[#29384a]">Registra una nueva asesoría en la plataforma.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="name">
            Nombre de la asesoría *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Gestoría López & Asociados"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="slug">
            Slug (identificador único) *
          </label>
          <input
            id="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="gestoria-lopez"
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 font-mono text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
          <p className="mt-1 text-xs text-[#29384a]/60">Solo letras minúsculas, números y guiones.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#07111d]" htmlFor="domain">
            Dominio <span className="font-normal text-[#29384a]">(opcional)</span>
          </label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="gestorialopez.com"
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

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !slug.trim()}
          className="w-full rounded-xl bg-[#d7a33a] py-3 text-sm font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creando...' : 'Crear tenant'}
        </button>
      </form>
    </div>
  );
}
