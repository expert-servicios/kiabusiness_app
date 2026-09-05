'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, ExternalLink, FileText, Link2, Mail, MessageCircle, RefreshCw, Search } from 'lucide-react';

type Communication = {
  id: string;
  date: string;
  channel: 'email' | 'whatsapp' | 'case_message';
  direction: 'in' | 'out' | 'internal';
  title: string;
  preview: string;
  body?: string | null;
  html?: string | null;
  status?: string | null;
  unread?: boolean;
  hasAttachment?: boolean;
  caseId?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  provider?: string | null;
  conversationId?: string | null;
  source: string;
};

type Company = {
  id: string;
  name: string;
};

type CaseSummary = {
  id: string;
  service: string;
  companyId: string | null;
  companyName: string | null;
};

type Payload = {
  client: { id: string; name: string; email: string };
  companies: Company[];
  cases: CaseSummary[];
  selectedCompanyId: string | null;
  communications: Communication[];
  counts: {
    total: number;
    email: number;
    whatsapp: number;
    caseMessages: number;
    unread: number;
    unassigned: number;
  };
};

type CompanyFilter = 'all' | 'unassigned' | string;
type ChannelFilter = 'all' | Communication['channel'];

export default function ClientCommunicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>('all');
  const [caseFilter, setCaseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Communication | null>(null);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyFilter !== 'all') params.set('companyId', companyFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/admin/clientes/${id}/communications${query}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudieron cargar las comunicaciones');
        return;
      }
      setData(json);
      setSelected((current) => {
        if (current && json.communications?.some((item: Communication) => item.id === current.id)) return current;
        return json.communications?.[0] ?? null;
      });
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [companyFilter, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const normalizedSearch = search.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return data.communications.filter((item) => {
      if (channel !== 'all' && item.channel !== channel) return false;
      if (caseFilter !== 'all' && item.caseId !== caseFilter) return false;
      const timestamp = new Date(item.date).getTime();
      if (from !== null && timestamp < from) return false;
      if (to !== null && timestamp > to) return false;
      if (normalizedSearch) {
        const haystack = `${item.title} ${item.preview} ${item.body ?? ''} ${item.companyName ?? ''} ${item.provider ?? ''}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [data, channel, caseFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    if (selected && !filtered.some((item) => item.id === selected.id)) {
      setSelected(filtered[0] ?? null);
    }
  }, [filtered, selected]);

  const channelLabel = (item: Communication) => {
    if (item.channel === 'email') return item.direction === 'out' ? 'Email enviado' : 'Email recibido';
    if (item.channel === 'whatsapp') return item.direction === 'out' ? 'WhatsApp enviado' : 'WhatsApp recibido';
    return item.direction === 'in' ? 'Mensaje cliente' : 'Mensaje expediente';
  };

  const linkEmailToCase = async (caseId: string | null) => {
    if (!selected?.conversationId) return;
    setLinking(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_email_thread',
          conversationId: selected.conversationId,
          caseId,
          subject: selected.title,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo vincular el hilo');
        return;
      }
      await load();
    } catch {
      setError('Error de conexión al vincular el hilo');
    } finally {
      setLinking(false);
    }
  };

  const selectedCase = selected?.caseId ? data?.cases.find((item) => item.id === selected.caseId) ?? null : null;
  const selectedCanLinkEmail = Boolean(selected?.channel === 'email' && selected.direction === 'in' && selected.conversationId);
  const openCorreoHref = selectedCanLinkEmail
    ? `/admin/correo?provider=${encodeURIComponent(selected?.provider ?? '')}&conversationId=${encodeURIComponent(selected?.conversationId ?? '')}`
    : '/admin/correo';

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.back()} className="rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#c88b25]" title="Volver">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="font-serif text-xl font-bold text-[#07111d]">Comunicaciones del cliente</h1>
                <p className="text-xs text-[#8a9aab]">{data?.client ? `${data.client.name} · ${data.client.email}` : 'Historial unificado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/clientes/${id}`} className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">Ficha 360º</Link>
              <Link href={openCorreoHref} className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">Abrir Correo 360</Link>
              <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-5 grid gap-3 rounded-xl border border-[#d8cbb5] bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
            Entidad
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm font-normal normal-case text-[#29384a] outline-none focus:border-[#c88b25]">
              <option value="all">Todas</option>
              {(data?.companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              <option value="unassigned">Sin entidad ({data?.counts.unassigned ?? 0})</option>
            </select>
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
            Expediente
            <select value={caseFilter} onChange={(event) => setCaseFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm font-normal normal-case text-[#29384a] outline-none focus:border-[#c88b25]">
              <option value="all">Todos</option>
              {(data?.cases ?? []).filter((item) => companyFilter === 'all' || companyFilter === 'unassigned' ? true : item.companyId === companyFilter).map((item) => (
                <option key={item.id} value={item.id}>{item.service}{item.companyName ? ` · ${item.companyName}` : ''}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
            Desde
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm font-normal normal-case text-[#29384a] outline-none focus:border-[#c88b25]" />
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
            Hasta
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm font-normal normal-case text-[#29384a] outline-none focus:border-[#c88b25]" />
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">
            Buscar
            <span className="mt-1.5 flex items-center rounded-lg border border-[#d8cbb5] bg-white px-3 focus-within:border-[#c88b25]">
              <Search className="h-3.5 w-3.5 text-[#8a9aab]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Asunto o contenido" className="w-full bg-transparent px-2 py-2 text-sm font-normal normal-case text-[#29384a] outline-none" />
            </span>
          </label>
        </div>

        {data && (
          <div className="mb-5 grid gap-3 sm:grid-cols-5">
            {[
              ['Total', data.counts.total], ['Email', data.counts.email], ['WhatsApp', data.counts.whatsapp], ['Expediente', data.counts.caseMessages], ['Sin leer', data.counts.unread],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#07111d]">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([['all', 'Todo'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['case_message', 'Expediente']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setChannel(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${channel === value ? 'bg-[#07111d] text-white' : 'border border-[#d8cbb5] bg-white text-[#29384a]'}`}>{label}</button>
            ))}
          </div>
          <p className="text-xs text-[#8a9aab]">{filtered.length} comunicación{filtered.length === 1 ? '' : 'es'} visible{filtered.length === 1 ? '' : 's'}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <section className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="border-b border-[#f0e8d8] px-4 py-3"><p className="text-sm font-bold text-[#07111d]">Historial</p></div>
            <div className="max-h-[72vh] overflow-y-auto">
              {loading && !data ? (
                <div className="flex justify-center py-14"><RefreshCw className="h-5 w-5 animate-spin text-[#c88b25]" /></div>
              ) : filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-[#8a9aab]">No hay comunicaciones para estos filtros.</p>
              ) : filtered.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelected(item)} className={`block w-full border-b border-[#f0e8d8] px-4 py-3 text-left transition ${selected?.id === item.id ? 'bg-[#f8f4eb]' : 'hover:bg-[#fbf8f2]'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-[#f0e8d8] p-2 text-[#c88b25]">{item.channel === 'email' ? <Mail className="h-4 w-4" /> : item.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-[#07111d]">{channelLabel(item)}</p>
                        <time className="shrink-0 text-[10px] text-[#8a9aab]">{new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</time>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[#29384a]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#8a9aab]">{item.preview}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.companyId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{item.companyName ?? 'Sin entidad'}</span>
                        {item.unread && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Sin leer</span>}
                        {item.hasAttachment && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">Adjunto</span>}
                        {item.status && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{item.status}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="min-h-[520px] rounded-2xl border border-[#d8cbb5] bg-white p-5">
            {!selected ? (
              <div className="flex min-h-[480px] items-center justify-center text-sm text-[#8a9aab]">Selecciona una comunicación.</div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e8d8] pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">{channelLabel(selected)}</p>
                    <h2 className="mt-1 font-serif text-xl font-bold text-[#07111d]">{selected.title}</h2>
                    <p className="mt-1 text-xs text-[#8a9aab]">{new Date(selected.date).toLocaleString('es-ES')} · fuente {selected.source}{selected.provider ? ` · ${selected.provider}` : ''}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#8a9aab]"><Building2 className="h-3 w-3" /> {selected.companyName ?? 'Sin entidad atribuida'}</p>
                    {selectedCase && <p className="mt-1 text-xs text-[#8a9aab]">Expediente: {selectedCase.service}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.caseId && <Link href={`/admin/expedientes/${selected.caseId}`} className="flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">Expediente <ExternalLink className="h-3 w-3" /></Link>}
                    {selectedCanLinkEmail && <Link href={openCorreoHref} className="flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-semibold text-white">Abrir y responder <Mail className="h-3 w-3" /></Link>}
                  </div>
                </div>

                {selectedCanLinkEmail && (
                  <div className="mt-4 rounded-xl border border-[#d8cbb5] bg-[#fbf8f2] p-4">
                    <div className="flex items-start gap-2">
                      <Link2 className="mt-0.5 h-4 w-4 text-[#c88b25]" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#07111d]">Vincular hilo a expediente</p>
                        <p className="mt-1 text-xs leading-5 text-[#8a9aab]">La entidad se deriva del expediente. No se asigna una entidad por email o nombre del cliente.</p>
                        <select value={selected.caseId ?? ''} onChange={(event) => void linkEmailToCase(event.target.value || null)} disabled={linking} className="mt-3 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#29384a] outline-none focus:border-[#c88b25] disabled:opacity-50">
                          <option value="">Sin expediente / sin entidad</option>
                          {(data?.cases ?? []).map((item) => <option key={item.id} value={item.id}>{item.service}{item.companyName ? ` · ${item.companyName}` : ' · Sin entidad'}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selected.html ? (
                  <iframe title={selected.title} sandbox="" referrerPolicy="no-referrer" srcDoc={selected.html} className="mt-4 min-h-[520px] w-full rounded-xl border border-[#e5e7eb] bg-white" />
                ) : (
                  <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbf8f2] p-4 text-sm leading-6 text-[#29384a]">{selected.body || selected.preview || 'Sin contenido disponible.'}</div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
