'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';

export function TenantDeliverableUpload({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setLastUploaded(null);
    if (file.size > 20 * 1024 * 1024) {
      setError('El archivo no puede superar 20 MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/tenant/cases/${caseId}/documents`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al subir'); return; }
      setLastUploaded(file.name);
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition ${
          dragging
            ? 'border-[#d7a33a] bg-[#d7a33a]/5'
            : 'border-[#d8cbb5] hover:border-[#d7a33a]/60 hover:bg-[#f8f4eb]'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#d7a33a]" />
        ) : (
          <Upload className="h-6 w-6 text-[#d7a33a]" />
        )}
        <p className="text-center text-sm text-[#29384a]">
          {uploading ? 'Subiendo...' : 'Arrastra un archivo o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-[#29384a]/50">PDF, Word, Excel, imágenes · Máx. 20 MB</p>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <X className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
      {lastUploaded && (
        <p className="flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{lastUploaded}</span>
          <span className="shrink-0">subido correctamente</span>
        </p>
      )}
    </div>
  );
}
