'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Mail, MessageCircle, RefreshCw } from 'lucide-react';

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
  provider?: string | null;
  source: string;
};

type Payload = {
  client: { id: string; name: string; email: string };
  communications: Communication[];
  counts: { total: number; email: number; whatsapp: number; caseMessages: number; unread: number };
};

export default function ClientCommunicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState<'all' | Communication['channel']>('all');
  const [selected, setSelected] = useState<Communication | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/communications`);
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudieron cargar las comunicaciones');
        return;
      }
      setData(json);
      setSelected((current) => current ?? json.communications?.[0] ?? null);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return channel === 'all'
      ? data.communications
      : data.communications.filter((item) => item.channel === channel);
  }, [data, channel]);

  const channelLabel = (item: Communication) => {
    if (item.channel === 'email') return item.direction === 'out' ? 'Email enviado' : 'Email recibido';
    if (item.channel === 'whatsapp') return item.direction === 'out' ? 'WhatsApp enviado' : 'WhatsApp recibido';
    return item.direction === 'in' ? 'Mensaje cliente' : 'Mensaje expediente';
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
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
                <h1 className="font-serif text-xl font-bold text-[#07111d]">Comunicaciones del cliente</h1>
                <p className="text-xs text-[#8a9aab]">
                  {data?.client ? `${data.client.name} · ${data.client.email}` : 'Historial unificado'}
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

      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {data && (
          <div className="mb-5 grid gap-3 sm:grid-cols-5">
            {[
              ['Total', data.counts.total],
              ['Email', data.counts.email],
              ['WhatsApp', data.counts.whatsapp],
              ['Expediente', data.counts.caseMessages],
              ['Sin leer', data.counts.unread],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a9aab]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#07111d]">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ['all', 'Todo'],
            ['email', 'Email'],
            ['whatsapp', 'WhatsApp'],
            ['case_message', 'Expediente'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setChannel(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                channel === value ? 'bg-[#07111d] text-white' : 'border border-[#d8cbb5] bg-white text-[#29384a]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <section className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="border-b border-[#f0e8d8] px-4 py-3">
              <p className="text-sm font-bold text-[#07111d]">Historial</p>
            </div>
            <div className="max-h-[72vh] overflow-y-auto">
              {loading && !data ? (
                <div className="flex justify-center py-14"><RefreshCw className="h-5 w-5 animate-spin text-[#c88b25]" /></div>
              ) : filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-[#8a9aab]">No hay comunicaciones en este canal.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`block w-full border-b border-[#f0e8d8] px-4 py-3 text-left transition ${selected?.id === item.id ? 'bg-[#f8f4eb]' : 'hover:bg-[#fbf8f2]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-[#f0e8d8] p-2 text-[#c88b25]">
                        {item.channel === 'email' ? <Mail className="h-4 w-4" /> : item.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-[#07111d]">{channelLabel(item)}</p>
                          <time className="shrink-0 text-[10px] text-[#8a9aab]">
                            {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                          </time>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold text-[#29384a]">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-[#8a9aab]">{item.preview}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.unread && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Sin leer</span>}
                          {item.hasAttachment && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">Adjunto</span>}
                          {item.status && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{item.status}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
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
                    <p className="mt-1 text-xs text-[#8a9aab]">
                      {new Date(selected.date).toLocaleString('es-ES')} · fuente {selected.source}{selected.provider ? ` · ${selected.provider}` : ''}
                    </p>
                  </div>
                  {selected.caseId && (
                    <Link
                      href={`/admin/expedientes/${selected.caseId}`}
                      className="flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]"
                    >
                      Expediente <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {selected.html ? (
                  <iframe
                    title={selected.title}
                    sandbox=""
                    referrerPolicy="no-referrer"
                    srcDoc={selected.html}
                    className="mt-4 min-h-[520px] w-full rounded-xl border border-[#e5e7eb] bg-white"
                  />
                ) : (
                  <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbf8f2] p-4 text-sm leading-6 text-[#29384a]">
                    {selected.body || selected.preview || 'Sin contenido disponible.'}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
