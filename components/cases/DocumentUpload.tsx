'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  original_name: string;
  state: string;
  created_at: string;
}

const DOC_STATE_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'En revisión', color: 'text-yellow-700 bg-yellow-50' },
  revisado: { label: 'Aprobado', color: 'text-green-700 bg-green-50' },
  rechazado: { label: 'Rechazado', color: 'text-red-700 bg-red-50' }
};

export function DocumentUpload({ caseId, initialDocuments }: { caseId: string; initialDocuments: Document[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/cases/${caseId}/documents`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Error al subir el archivo');
        return;
      }
      setSuccess(`"${file.name}" subido correctamente.`);
      router.refresh();
    } catch {
      setError('Error de conexión al subir el archivo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#07111d]">Documentos</h3>
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#c88b25] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Subiendo...' : 'Subir documento'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
        </label>
      </div>

      {error ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      ) : null}

      {initialDocuments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d8cbb5] p-6 text-center text-sm text-[#29384a]">
          No hay documentos todavía. Sube los archivos que necesitemos para tu trámite.
        </p>
      ) : (
        <div className="space-y-2">
          {initialDocuments.map((doc) => {
            const cfg = DOC_STATE_LABELS[doc.state] ?? DOC_STATE_LABELS.pendiente;
            return (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 flex-shrink-0 text-[#c88b25]" />
                  <div>
                    <p className="text-sm font-medium text-[#07111d]">{doc.original_name}</p>
                    <p className="text-xs text-[#29384a]">{new Date(doc.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
