'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface Props { reportId: string }

type Format = 'pdf' | 'excel' | 'word';

const FORMAT_CONFIG: Record<Format, { label: string; ext: string; mime: string; color: string }> = {
  pdf  : { label: 'PDF',   ext: 'pdf',  mime: 'application/pdf', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  excel: { label: 'Excel', ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  word : { label: 'Word',  ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
};

export function ReportExportBar({ reportId }: Props) {
  const [loading, setLoading] = useState<Format | null>(null);

  async function handleDownload(format: Format) {
    setLoading(format);
    try {
      const res = await fetch(`/api/reports/${reportId}/${format}`);
      if (!res.ok) { alert(`Error generando ${format.toUpperCase()}`); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `informe-empresa-${reportId.slice(0, 8)}.${FORMAT_CONFIG[format].ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error de conexión al descargar el informe.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-[#7a6e5f]">Descargar:</span>
      {(Object.entries(FORMAT_CONFIG) as [Format, typeof FORMAT_CONFIG[Format]][]).map(([fmt, cfg]) => (
        <button
          key={fmt}
          type="button"
          onClick={() => handleDownload(fmt)}
          disabled={loading !== null}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${cfg.color}`}
        >
          {loading === fmt
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileDown className="h-3.5 w-3.5" />
          }
          {cfg.label}
        </button>
      ))}
    </div>
  );
}
