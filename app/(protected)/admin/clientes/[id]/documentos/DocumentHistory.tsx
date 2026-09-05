'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, History, RefreshCw } from 'lucide-react';

type ChangeItem = {
  field: string;
  label: string;
  before: string;
  after: string;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  actor: { id: string; name: string; email: string | null; role: string | null } | null;
  changes: ChangeItem[];
};

export default function DocumentHistory({ clientId, documentId }: { clientId: string; documentId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ documentId });
      const response = await fetch(`/api/admin/clientes/${clientId}/documents/history?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo cargar el historial');
        return;
      }
      setHistory(Array.isArray(json.history) ? json.history : []);
      setLoaded(true);
    } catch {
      setError('Error de conexión al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded && !loading) await load();
  };

  return (
    <div className="mt-3 border-t border-[#eee5d8] pt-3">
      <button
        type="button"
        onClick={() => void toggle()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526173] hover:text-[#07111d]"
      >
        <History className="h-3.5 w-3.5" /> Historial
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-[#eadfce] bg-[#fbf8f2] p-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[#8a9aab]"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Cargando historial…</div>
          ) : error ? (
            <div className="text-xs text-red-700">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-xs text-[#8a9aab]">Todavía no hay cambios administrativos registrados para este documento.</div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-[#eadfce] bg-white px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8a9aab]">
                    <span>{entry.actor?.name ?? 'Administrador'}{entry.actor?.role ? ` · ${entry.actor.role}` : ''}</span>
                    <span>{new Date(entry.createdAt).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {entry.changes.map((change) => (
                      <div key={`${entry.id}-${change.field}`} className="grid gap-1 text-xs text-[#29384a] sm:grid-cols-[110px_1fr]">
                        <strong>{change.label}</strong>
                        <span><span className="text-[#8a9aab]">{change.before}</span> → {change.after}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
