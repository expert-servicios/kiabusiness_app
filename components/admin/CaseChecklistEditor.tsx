'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Loader2 } from 'lucide-react';

export function CaseChecklistEditor({
  caseId,
  initialItems
}: {
  caseId: string;
  initialItems: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialItems.join('\n'));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const items = useMemo(
    () => value.split('\n').map((item) => item.trim()).filter(Boolean),
    [value]
  );

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs_checklist: items })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo guardar el checklist');
        return;
      }

      setMessage('Checklist guardado.');
      router.refresh();
    } catch {
      setMessage('Error de conexion.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[#c88b25]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Checklist documental</p>
        </div>
        <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-xs font-semibold text-[#29384a]">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={6}
        placeholder="Un documento por linea"
        className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm leading-6 text-[#07111d] outline-none transition placeholder:text-[#8a7d69] focus:border-[#c88b25]"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#d7a33a] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#f0bf54] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Guardar checklist
        </button>
        {message ? <p className="text-sm text-[#29384a]">{message}</p> : null}
      </div>
    </div>
  );
}
