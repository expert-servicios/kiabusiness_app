'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export type DocClassification = {
  id: string;
  source: string;
  detected_type: string;
  detected_subtype: string | null;
  confidence: number;
  status: string;
  extracted_data: Record<string, string>;
  created_at: string;
  client: { id: string; full_name: string | null; email: string } | null;
  case:   { id: string; service: string } | null;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  requerimiento:       'Requerimiento',
  modelo_aeat:         'Modelo AEAT',
  factura_emitida:     'Factura emitida',
  factura_recibida:    'Factura recibida',
  dni:                 'DNI',
  nie:                 'NIE',
  tie:                 'TIE',
  pasaporte:           'Pasaporte',
  datos_fiscales_aeat: 'Datos fiscales AEAT',
  contrato:            'Contrato',
  escritura:           'Escritura',
  certificado:         'Certificado',
  justificante_pago:   'Justificante de pago',
  documento_bancario:  'Documento bancario',
  excel_contable:      'Excel contable',
  certificado_digital: 'Certificado digital',
  otros:               'Otros',
};

const ALL_TYPES = Object.keys(DOCUMENT_TYPE_LABELS);

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email:    'Email',
  portal:   'Portal',
  drive:    'Drive',
  admin:    'Admin',
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 75 ? 'bg-emerald-100 text-emerald-800'
    : pct >= 50 ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'needs_review') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        <AlertCircle className="h-3 w-3" /> Revisar
      </span>
    );
  }
  if (status === 'corrected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" /> Corregido
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        <XCircle className="h-3 w-3" /> Rechazado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
      <CheckCircle2 className="h-3 w-3" /> Clasificado
    </span>
  );
}

function DocRow({ doc, onUpdate }: { doc: DocClassification; onUpdate: (id: string, type: string, status: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(doc.detected_type);
  const [saving, setSaving] = useState(false);

  const sourceUrl = doc.extracted_data?.source_url as string | undefined;
  const fileName  = sourceUrl ? decodeURIComponent(sourceUrl.split('/').pop() ?? 'archivo') : '—';

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ detected_type: selectedType, status: 'corrected' }),
      });
      if (res.ok) {
        onUpdate(doc.id, selectedType, 'corrected');
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function reject() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'rejected' }),
      });
      if (res.ok) {
        onUpdate(doc.id, doc.detected_type, 'rejected');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 transition ${doc.status === 'needs_review' ? 'border-amber-200 bg-amber-50/40' : 'border-[#d8cbb5] bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: file info */}
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#c88b25]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#07111d]" title={fileName}>{fileName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#29384a]">{SOURCE_LABELS[doc.source] ?? doc.source}</span>
              <span className="text-xs text-[#29384a]">·</span>
              <span className="text-xs text-[#29384a]">
                {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {doc.client && (
                <>
                  <span className="text-xs text-[#29384a]">·</span>
                  <Link href={`/admin/clientes/${doc.client.id}`} className="text-xs font-medium text-[#c88b25] hover:underline">
                    {doc.client.full_name ?? doc.client.email}
                  </Link>
                </>
              )}
              {doc.case && (
                <>
                  <span className="text-xs text-[#29384a]">·</span>
                  <Link href={`/admin/expedientes/${doc.case.id}`} className="inline-flex items-center gap-0.5 text-xs font-medium text-[#c88b25] hover:underline">
                    {doc.case.service} <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </>
              )}
            </div>
            {doc.extracted_data.nif && (
              <p className="mt-1 text-xs text-[#29384a]">NIF detectado: <strong>{doc.extracted_data.nif}</strong></p>
            )}
          </div>
        </div>

        {/* Right: classification + actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <ConfidenceBadge confidence={doc.confidence} />
          <StatusBadge status={doc.status} />

          {doc.status !== 'corrected' && doc.status !== 'rejected' && (
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-lg border border-[#d8cbb5] px-2.5 py-1 text-xs font-semibold text-[#29384a] hover:border-[#c88b25] hover:text-[#07111d] transition"
            >
              Corregir
            </button>
          )}
        </div>
      </div>

      {/* Inline type editor */}
      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#d8cbb5] pt-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-1 text-xs text-[#07111d] focus:border-[#c88b25] focus:outline-none"
          >
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#07111d] px-3 py-1 text-xs font-semibold text-white hover:bg-[#29384a] transition disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={reject}
            disabled={saving}
            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-[#29384a] hover:text-[#07111d]"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Current detected type */}
      {!editing && (
        <div className="mt-2">
          <span className="text-xs text-[#29384a]">
            Tipo detectado: <strong className="text-[#07111d]">
              {DOCUMENT_TYPE_LABELS[doc.detected_type] ?? doc.detected_type}
              {doc.detected_subtype ? ` — ${doc.detected_subtype}` : ''}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}

export function DocumentClassificationList({ initialDocuments }: { initialDocuments: DocClassification[] }) {
  const [docs, setDocs] = useState(initialDocuments);
  const [filterStatus, setFilterStatus] = useState<string>('needs_review');

  function handleUpdate(id: string, newType: string, newStatus: string) {
    setDocs((prev) =>
      prev.map((d) => d.id === id ? { ...d, detected_type: newType, status: newStatus } : d)
    );
  }

  const filtered = filterStatus === 'all'
    ? docs
    : docs.filter((d) => d.status === filterStatus);

  const pending = docs.filter((d) => d.status === 'needs_review').length;

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { value: 'needs_review', label: `Pendientes${pending > 0 ? ` (${pending})` : ''}` },
          { value: 'classified',   label: 'Clasificados' },
          { value: 'corrected',    label: 'Corregidos' },
          { value: 'all',          label: 'Todos' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filterStatus === value
                ? 'bg-[#07111d] text-white'
                : 'border border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-sm text-[#29384a]">
          {filterStatus === 'needs_review'
            ? 'No hay documentos pendientes de revisión.'
            : 'No hay documentos en esta categoría.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocRow key={doc.id} doc={doc} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
