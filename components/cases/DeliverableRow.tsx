'use client';

import { useState } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';

interface Doc {
  id: string;
  original_name: string;
  created_at: string;
}

export function DeliverableRow({ doc }: { doc: Doc }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al descargar'); return; }
      const a = document.createElement('a');
      a.href = data.url;
      a.download = doc.original_name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#d7a33a]/40 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 shrink-0 text-[#c88b25]" />
        <div>
          <p className="text-sm font-semibold text-[#07111d]">{doc.original_name}</p>
          <p className="text-xs text-[#29384a]">
            {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {loading ? 'Descargando...' : 'Descargar'}
        </button>
      </div>
    </div>
  );
}
