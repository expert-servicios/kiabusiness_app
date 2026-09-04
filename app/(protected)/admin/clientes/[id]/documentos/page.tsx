'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Download, ExternalLink, FileText, FolderOpen, RefreshCw, Search } from 'lucide-react';

type DocumentItem = {
  id: string;
  name: string;
  title: string | null;
  docType: string | null;
  mimeType: string | null;
  state: string | null;
  kind: string | null;
  uploadedByRole: string | null;
  createdAt: string;
  caseId: string | null;
  caseName: string | null;
  companyId: string | null;
  companyName: string | null;
  driveFileId: string | null;
  downloadUrl: string | null;
  source: 'documents';
};

type Payload = {
  client: { id: string; name: string; email: string };
  companies: { id: string; name: string }[];
  documents: DocumentItem[];
  counts: {
    total: number;
    withCase: number;
    withCompany: number;
    unassigned: number;
    technicalExcluded: number;
  };
};

export default function ClientDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyFilter !== 'all') params.set('companyId', companyFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/admin/clientes/${id}/documents${qs}`);
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudieron cargar los documentos');
        return;
      }
      setData(json);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [companyFilter, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data.documents;
    return data.documents.filter((doc) => [
      doc.name,
      doc.title,
      doc.docType,
      doc.state,
      doc.caseName,
      doc.companyName,
      doc.uploadedByRole,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
  }, [data, query]);

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#c88b25]"
                title="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="font-serif text-xl font-bold text-[#07111d]">Documentación 360º</h1>
                <p className="text-xs text-[#8a9aab]">
                  {data?.client ? `${data.client.name} · ${data.client.email}` : 'Documentación operativa del cliente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/clientes/${id}`}
                className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]"
              >
                Ficha 360º
              </Link>
              <button
                type="button"
                onClick={() => void load()}
                className="flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-[#d8cbb5] bg-white p-4">
            <label htmlFor="documents-company" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
              <Building2 className="h-3.5 w-3.5" /> Entidad
            </label>
            <select
              id="documents-company"
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#29384a] outline-none focus:border-[#c88b25]"
            >
              <option value="all">Todas las entidades</option>
              {(data?.companies ?? []).map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
              <option value="unassigned">Sin entidad ({data?.counts.unassigned ?? 0})</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#d8cbb5] bg-white p-4">
            <label htmlFor="documents-search" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
              <Search className="h-3.5 w-3.5" /> Buscar
            </label>
            <input
              id="documents-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, tipo, expediente, entidad…"
              className="w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#29384a] outline-none placeholder:text-[#9ca3af] focus:border-[#c88b25]"
            />
          </div>
        </div>

        {data && (
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            {[
              ['Documentos', data.counts.total],
              ['Con expediente', data.counts.withCase],
              ['Con entidad', data.counts.withCompany],
              ['Técnicos excluidos', data.counts.technicalExcluded],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#07111d]">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          Esta vista es de solo lectura. Reúne únicamente documentos vinculados de forma explícita al cliente, a sus expedientes o a sus entidades. Los artefactos técnicos internos no se muestran como documentación del cliente.
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-[#c88b25]" /></div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <p className="mt-3 text-sm font-semibold text-[#29384a]">No hay documentos operativos para estos filtros.</p>
            <p className="mt-1 text-xs text-[#8a9aab]">No se muestran artefactos internos de sistema ni se infiere ownership.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((doc) => (
              <article key={doc.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="rounded-xl bg-[#f0e8d8] p-2.5 text-[#c88b25]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-sm font-bold text-[#07111d]">{doc.name}</h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${doc.companyId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {doc.companyName ?? 'Sin entidad'}
                        </span>
                        {doc.state && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{doc.state}</span>}
                        {doc.docType && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{doc.docType}</span>}
                        {doc.uploadedByRole && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{doc.uploadedByRole}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a9aab]">
                        <span>{new Date(doc.createdAt).toLocaleString('es-ES')}</span>
                        {doc.mimeType && <span>{doc.mimeType}</span>}
                        <span>Fuente: {doc.source}</span>
                      </div>
                      {doc.caseId && (
                        <Link href={`/admin/expedientes/${doc.caseId}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c88b25] hover:underline">
                          <FolderOpen className="h-3.5 w-3.5" /> {doc.caseName ?? 'Abrir expediente'} <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {doc.downloadUrl ? (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]"
                    >
                      <Download className="h-3.5 w-3.5" /> Abrir
                    </a>
                  ) : doc.driveFileId ? (
                    <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">Drive vinculado</span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">Sin archivo accesible</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
