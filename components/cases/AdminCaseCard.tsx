'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
}

const caseStates = [
  'pendiente_documentacion',
  'en_revision',
  'en_proceso',
  'presentado',
  'finalizado'
] as const;

type CaseState = (typeof caseStates)[number];

const stateLabels: Record<CaseState, string> = {
  pendiente_documentacion: 'Pendiente documentación',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado',
  finalizado: 'Finalizado'
};

export function AdminCaseCard({ caseItem }: { caseItem: Case }) {
  const router = useRouter();
  const [state, setState] = useState<CaseState>(caseItem.state as CaseState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/cases/${caseItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo actualizar el expediente');
        return;
      }
      setMessage('Estado actualizado correctamente.');
      router.refresh();
    } catch {
      setMessage('Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-5 w-5 text-[#c88b25]" />
          <div>
            <p className="text-sm font-semibold text-[#07111d]">{caseItem.service}</p>
            <p className="text-xs text-[#29384a]">{caseItem.category}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
          {stateLabels[caseItem.state as CaseState] ?? caseItem.state}
        </span>
      </div>

      <div className="mt-4 text-xs text-[#29384a]">
        Abierto el {new Date(caseItem.opened_at).toLocaleDateString('es-ES')}
        {caseItem.closed_at ? ` · Cerrado el ${new Date(caseItem.closed_at).toLocaleDateString('es-ES')}` : ''}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={state}
          onChange={(e) => setState(e.target.value as CaseState)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        >
          {caseStates.map((s) => (
            <option key={s} value={s}>
              {stateLabels[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || state === caseItem.state}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Cambiar estado'}
        </button>

        {message ? <p className="text-sm text-[#29384a]">{message}</p> : null}
      </div>
    </div>
  );
}
