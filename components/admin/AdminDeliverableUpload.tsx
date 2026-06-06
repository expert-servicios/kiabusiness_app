'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AdminDeliverableUpload({ caseId }: { caseId: string }) {
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
      const res = await fetch(`/api/cases/${caseId}/documents`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al subir el entregable');
        return;
      }
      setSuccess(`"${file.name}" subido como entregable.`);
      router.refresh();
    } catch {
      setError('Error de conexión al subir el archivo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d7a33a] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#c88b25] transition hover:bg-[#d7a33a]/10 ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}>
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Subiendo...' : 'Subir entregable'}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.zip,.xml"
        />
      </label>
      <p className="text-xs text-[#29384a]">
        El cliente verá este archivo en la sección «Entregables» de su expediente.
      </p>
    </div>
  );
}
