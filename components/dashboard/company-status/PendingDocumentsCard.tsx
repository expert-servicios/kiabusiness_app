import Link from 'next/link';
import { FileSearch } from 'lucide-react';

interface PendingDoc {
  id: string;
  detected_type: string;
  extracted_data: Record<string, string>;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  requerimiento:    'Requerimiento',
  modelo_aeat:      'Modelo AEAT',
  factura_emitida:  'Factura emitida',
  factura_recibida: 'Factura recibida',
  otros:            'Documento',
};

export function PendingDocumentsCard({ documents }: { documents: PendingDoc[] }) {
  if (documents.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-amber-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Documentos pendientes de revisión
        </p>
        <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
          {documents.length}
        </span>
      </div>
      <p className="mb-3 text-xs text-amber-700">
        Estos documentos fueron recibidos pero necesitan tu confirmación.
      </p>
      <div className="space-y-1.5">
        {documents.slice(0, 5).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
            <span className="font-medium text-[#07111d]">
              {TYPE_LABELS[doc.detected_type] ?? doc.detected_type}
              {doc.extracted_data?.modelo ? ` ${doc.extracted_data.modelo}` : ''}
              {doc.extracted_data?.ejercicio ? ` — ${doc.extracted_data.ejercicio}` : ''}
            </span>
            <span className="text-[#29384a]">
              {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
      {documents.length > 5 && (
        <p className="mt-2 text-xs text-amber-700">y {documents.length - 5} más…</p>
      )}
      <Link
        href="/dashboard/expedientes"
        className="mt-3 inline-block text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
      >
        Ver expedientes →
      </Link>
    </div>
  );
}
