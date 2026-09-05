'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, FileText, RefreshCw, Save } from 'lucide-react';

type Requirement = {
  requirement: string;
  covered: boolean;
  documents: Array<{ id: string; name: string } | null>;
};

type CaseDocument = {
  id: string;
  name: string;
  state: string | null;
  createdAt: string | null;
  requirement: string | null;
};

type ChecklistCase = {
  id: string;
  service: string | null;
  category: string | null;
  state: string | null;
  companyId: string | null;
  companyName: string | null;
  requirements: Requirement[];
  documents: CaseDocument[];
  counts: {
    total: number;
    covered: number;
    missing: number;
    orphaned: number;
  };
  linkStoreSupported: boolean;
};

type Payload = {
  client: { id: string; name: string };
  cases: ChecklistCase[];
};

export default function DocumentChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/documents/checklist`);
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo cargar la cobertura documental');
        return;
      }
      setData(json);
      const nextDrafts: Record<string, string> = {};
      for (const item of json.cases ?? []) {
        for (const doc of item.documents ?? []) nextDrafts[doc.id] = doc.requirement ?? '';
      }
      setDrafts(nextDrafts);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    const cases = data?.cases ?? [];
    return cases.reduce((acc, item) => ({
      requirements: acc.requirements + item.counts.total,
      covered: acc.covered + item.counts.covered,
      missing: acc.missing + item.counts.missing,
      documents: acc.documents + item.documents.length,
    }), { requirements: 0, covered: 0, missing: 0, documents: 0 });
  }, [data]);

  async function saveLink(documentId: string) {
    setSavingId(documentId);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/documents/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          requirement: drafts[documentId]?.trim() || null,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo guardar el vínculo');
        return;
      }
      setMessage('Vínculo documental guardado.');
      await load();
    } catch {
      setError('Error de conexión al guardar');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/admin/clientes/${id}/documentos`} className="rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#c88b25]" aria-label="Volver a Documentación 360">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="font-serif text-xl font-bold text-[#07111d]">Checklist documental 360º</h1>
                <p className="text-xs text-[#8a9aab]">{data?.client?.name ?? 'Cobertura documental por expediente'}</p>
              </div>
            </div>
            <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          {[
            ['Requisitos', totals.requirements],
            ['Cubiertos', totals.covered],
            ['Pendientes', totals.missing],
            ['Documentos', totals.documents],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">{label}</p>
              <p className="mt-1 text-xl font-bold text-[#07111d]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          Los requisitos proceden del checklist del expediente. Vincular un documento sólo registra qué requisito cubre; no mueve archivos, no cambia la entidad ni el expediente y no elimina documentos. Los cambios quedan auditados.
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-[#c88b25]" /></div>
        ) : (data?.cases ?? []).length === 0 ? (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white py-16 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <p className="mt-3 text-sm font-semibold text-[#29384a]">Este cliente todavía no tiene expedientes.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {(data?.cases ?? []).map((item) => (
              <section key={item.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#07111d]">{item.service || item.category || 'Expediente'}</h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#8a9aab]">
                      <span>{item.companyName ?? 'Sin entidad'}</span>
                      {item.state && <span>· {item.state}</span>}
                      <Link href={`/admin/expedientes/${item.id}`} className="font-semibold text-[#c88b25] hover:underline">Abrir expediente</Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Cubiertos: {item.counts.covered}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Pendientes: {item.counts.missing}</span>
                    {item.counts.orphaned > 0 && <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">Vínculos huérfanos: {item.counts.orphaned}</span>}
                  </div>
                </div>

                {!item.linkStoreSupported && (
                  <div className="mt-4 flex gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Este expediente contiene un formato histórico de documentos recibidos. No se permitirá sobrescribirlo automáticamente; requiere revisión manual.
                  </div>
                )}

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-[#c88b25]" />
                      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8a9aab]">Requisitos</h3>
                    </div>
                    {item.requirements.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#d8cbb5] bg-[#fbf8f2] p-4 text-sm text-[#6f7f8f]">
                        El expediente no tiene requisitos definidos. Añádelos desde el checklist del expediente antes de vincular documentos.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.requirements.map((requirement) => (
                          <div key={requirement.requirement} className="rounded-xl border border-[#eadfce] bg-[#fbf8f2] p-3">
                            <div className="flex items-start gap-2">
                              {requirement.covered
                                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#07111d]">{requirement.requirement}</p>
                                <p className="mt-1 text-xs text-[#8a9aab]">
                                  {requirement.documents.length > 0
                                    ? requirement.documents.map((doc) => doc?.name).filter(Boolean).join(', ')
                                    : 'Documento pendiente'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#c88b25]" />
                      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8a9aab]">Documentos del expediente</h3>
                    </div>
                    {item.documents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#d8cbb5] bg-[#fbf8f2] p-4 text-sm text-[#6f7f8f]">
                        Todavía no hay documentos canónicos vinculados a este expediente.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.documents.map((doc) => {
                          const unchanged = (drafts[doc.id] ?? '') === (doc.requirement ?? '');
                          return (
                            <div key={doc.id} className="rounded-xl border border-[#eadfce] bg-[#fbf8f2] p-3">
                              <p className="text-sm font-semibold text-[#07111d]">{doc.name}</p>
                              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <select
                                  value={drafts[doc.id] ?? ''}
                                  onChange={(event) => setDrafts((current) => ({ ...current, [doc.id]: event.target.value }))}
                                  disabled={!item.linkStoreSupported || item.requirements.length === 0}
                                  className="min-w-0 flex-1 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs text-[#29384a] disabled:bg-gray-100"
                                >
                                  <option value="">Sin requisito asignado</option>
                                  {item.requirements.map((requirement) => (
                                    <option key={requirement.requirement} value={requirement.requirement}>{requirement.requirement}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void saveLink(doc.id)}
                                  disabled={unchanged || savingId === doc.id || !item.linkStoreSupported}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Save className="h-3.5 w-3.5" /> {savingId === doc.id ? 'Guardando…' : 'Guardar'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
