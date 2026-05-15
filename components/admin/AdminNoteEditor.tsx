'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StickyNote } from 'lucide-react';

export function AdminNoteEditor({ caseId, initialNote }: { caseId: string; initialNote: string | null }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: note })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'No se pudo guardar'); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-[#c88b25]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Nota interna</p>
        <span className="ml-1 text-xs text-[#29384a]">(solo visible para admin)</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder="Observaciones internas, seguimiento, alertas…"
        rows={4}
        className="w-full resize-y rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-full bg-[#c88b25] px-5 py-2 text-sm font-bold text-[#061321] transition hover:bg-[#b57a1e] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar nota'}
        </button>
        {saved && <p className="text-sm font-semibold text-green-700">Guardado ✓</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
