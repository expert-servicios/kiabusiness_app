'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, ExternalLink } from 'lucide-react';
import { CASE_PROGRESS_STATES, CASE_STATE_LABELS } from '@/lib/utils/case-states';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  client?: { full_name: string | null; email: string };
}

const caseStates = [
  ...CASE_PROGRESS_STATES,
  'pendiente_documentacion',
  'en_revision',
  'en_proceso',
  'presentado'
] as const;

type CaseState = (typeof caseStates)[number];

export function AdminCaseCard({ caseItem }: { caseItem: Case }) {
  const router = useRouter();
  const [state, setState] = useState<CaseState>(caseItem.state as CaseState);
  const [note, setNote] = useState('');
  const [organism, setOrganism] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const stateChanged = state !== caseItem.state;
  const needsOrganism = state === 'pendiente_externo';

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = { state };
      if (note.trim()) payload.note = note.trim();
      if (needsOrganism && organism.trim()) payload.organism = organism.trim();

      const response = await fetch(`/api/cases/${caseItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo actualizar el expediente');
        return;
      }
      setMessage('Estado actualizado correctamente.');
      setNote('');
      setOrganism('');
      router.refresh();
    } catch {
      setMessage('Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#c88b25]" />
          <div>
            <p className="text-sm font-semibold text-[#07111d]">{caseItem.service}</p>
            <p className="text-xs text-[#29384a]">{caseItem.category}</p>
            {caseItem.client && (
              <p className="mt-1 text-xs text-[#29384a]">
                {caseItem.client.full_name
                  ? `${caseItem.client.full_name} · ${caseItem.client.email}`
                  : caseItem.client.email}
              </p>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
          {CASE_STATE_LABELS[caseItem.state] ?? caseItem.state}
        </span>
      </div>

      <div className="mt-3 text-xs text-[#29384a]">
        Abierto el {new Date(caseItem.opened_at).toLocaleDateString('es-ES')}
        {caseItem.closed_at ? ` · Cerrado el ${new Date(caseItem.closed_at).toLocaleDateString('es-ES')}` : ''}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={state}
          onChange={(e) => { setState(e.target.value as CaseState); setMessage(null); }}
          aria-label="Estado del expediente"
          className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        >
          {caseStates.map((s) => (
            <option key={s} value={s}>{CASE_STATE_LABELS[s]}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !stateChanged}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Cambiar estado'}
        </button>

        <Link
          href={`/admin/expedientes/${caseItem.id}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d]"
        >
          <ExternalLink className="h-3 w-3" />
          Ver detalle
        </Link>
      </div>

      {/* Extra fields — only visible when state changes */}
      {stateChanged && (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#d8cbb5] bg-white p-4">
          {needsOrganism && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#29384a]">
                Organismo externo <span className="text-[#c88b25]">*</span>
              </label>
              <input
                type="text"
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                placeholder="Ej: Oficina de Extranjería de Madrid, AEAT…"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#29384a]">
              Mensaje al cliente <span className="text-xs font-normal text-[#29384a]">(opcional — se incluye en el email de notificación)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Hemos recibido tu documentación y comenzamos la tramitación esta semana…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm font-semibold ${message.includes('correctamente') ? 'text-green-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
