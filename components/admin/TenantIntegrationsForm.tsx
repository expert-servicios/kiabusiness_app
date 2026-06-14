'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface IntegrationStatus {
  integration: string;
  configured: boolean;
  updated_at: string;
}

const INTEGRATIONS = [
  {
    key: 'holded',
    label: 'Holded',
    description: 'API key de la cuenta Holded de esta asesoría. Se usa para sincronizar empresas y generar facturas.',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    docsUrl: 'https://developers.holded.com/reference/getting-started',
  },
];

export function TenantIntegrationsForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}/integrations`)
      .then((r) => r.json())
      .then((d) => setStatuses(d.integrations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  const isConfigured = (key: string) => statuses.some((s) => s.integration === key);
  const getUpdated = (key: string) => statuses.find((s) => s.integration === key)?.updated_at;

  const handleRemove = async (key: string) => {
    await fetch(`/api/admin/tenants/${tenantId}/integrations?integration=${key}`, { method: 'DELETE' });
    setStatuses((prev) => prev.filter((s) => s.integration !== key));
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#d7a33a]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {INTEGRATIONS.map((intg) => (
        <IntegrationCard
          key={intg.key}
          tenantId={tenantId}
          intg={intg}
          configured={isConfigured(intg.key)}
          updatedAt={getUpdated(intg.key)}
          onSaved={() => {
            setStatuses((prev) => [
              ...prev.filter((s) => s.integration !== intg.key),
              { integration: intg.key, configured: true, updated_at: new Date().toISOString() },
            ]);
          }}
          onRemoved={() => handleRemove(intg.key)}
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  tenantId,
  intg,
  configured,
  updatedAt,
  onSaved,
  onRemoved,
}: {
  tenantId: string;
  intg: { key: string; label: string; description: string; placeholder: string; docsUrl: string };
  configured: boolean;
  updatedAt?: string;
  onSaved: () => void;
  onRemoved: () => void;
}) {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration: intg.key, secret: secret.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      setSecret('');
      setSaved(true);
      onSaved();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#07111d]">{intg.label}</p>
            {configured && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Configurada
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#29384a]">{intg.description}</p>
          {configured && updatedAt && (
            <p className="mt-1 text-[10px] text-[#29384a]/50">
              Actualizada {new Date(updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        {configured && (
          <button
            type="button"
            onClick={onRemoved}
            className="shrink-0 rounded-lg p-1.5 text-[#29384a]/40 transition hover:bg-red-50 hover:text-red-500"
            title="Eliminar integración"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type={showSecret ? 'text' : 'password'}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={configured ? '••••••••••••••••••••• (nueva clave)' : intg.placeholder}
            className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] py-2.5 pl-4 pr-10 font-mono text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#29384a]/40 hover:text-[#29384a]"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={saving || !secret.trim()}
          className="shrink-0 rounded-xl bg-[#d7a33a] px-4 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : configured ? 'Actualizar' : 'Guardar'}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-xs text-green-600">Clave guardada correctamente.</p>}

      <a
        href={intg.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-[#d7a33a] hover:underline"
      >
        ¿Dónde encuentro la API key de {intg.label}? →
      </a>
    </div>
  );
}
