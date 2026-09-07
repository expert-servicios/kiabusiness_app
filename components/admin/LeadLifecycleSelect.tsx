'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospecto' },
  { value: 'customer', label: 'Cliente' },
  { value: 'former_customer', label: 'Antiguo cliente' },
];

export function LeadLifecycleSelect({ leadId, currentStage }: { leadId: string; currentStage: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: string) {
    const previous = stage;
    setStage(next);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/leads?id=${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifecycle_stage: next }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar');
      router.refresh();
    } catch {
      setStage(previous);
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={stage}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value)}
        aria-label="Etapa CRM del contacto"
        className="rounded-lg border border-[#d8cbb5] bg-white px-2.5 py-2 text-xs font-semibold text-[#29384a] disabled:opacity-60"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {saving && <span className="text-[11px] text-[#7a6d5c]">Guardando…</span>}
      {error && <span className="text-[11px] text-red-700">{error}</span>}
    </div>
  );
}
