'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, Loader2, Mail, RefreshCw } from 'lucide-react';

type FolderInfo = {
  id: string;
  name: string;
  slug: string;
  system_key: 'inbox' | 'sent' | null;
  is_system: boolean;
};

type FolderItem = {
  sourceKind: 'inbox_thread' | 'sent_event';
  provider: string;
  sourceKey: string;
  clientId: string | null;
  companyId: string | null;
  caseId: string | null;
  movedAt: string;
  subject: string;
  counterpart: string;
  email: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
  html: string | null;
  status: string | null;
};

type ThreadMessage = {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  bodyType: 'html' | 'text';
};

export function CorreoFolderView({ folderId }: { folderId: string }) {
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [selected, setSelected] = useState<FolderItem | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/correo/folders?folderId=${encodeURIComponent(folderId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar la carpeta');
      setFolder(json.folder ?? null);
      setItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la carpeta');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { void load(); }, [load]);

  const title = folder?.name ?? 'Carpeta';
  const sortedItems = useMemo(() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [items]);

  async function openItem(item: FolderItem) {
    setSelected(item);
    setMessages([]);
    setError('');
    if (item.sourceKind !== 'inbox_thread') return;
    if (item.provider !== 'gmail' && item.provider !== 'ms365') return;
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/correo?action=conversation&provider=${encodeURIComponent(item.provider)}&conversationId=${encodeURIComponent(item.sourceKey)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo abrir el hilo');
      setMessages(json.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el hilo');
    } finally {
      setLoadingThread(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div>;
  }

  return (
    <main className="min-h-screen bg-[#faf8f2] p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/correo" className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#29384a] hover:border-[#c88b25]" aria-label="Volver a Correo">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c88b25]">Correo 360</p>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">{title}</h1>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#29384a] hover:border-[#c88b25]" title="Actualizar">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="flex items-center gap-2 border-b border-[#f0e9d8] px-4 py-3">
              <FolderOpen className="h-4 w-4 text-[#c88b25]" />
              <span className="text-sm font-semibold text-[#07111d]">{sortedItems.length} elemento{sortedItems.length === 1 ? '' : 's'}</span>
            </div>
            <div className="max-h-[72vh] overflow-y-auto divide-y divide-[#f0e9d8]">
              {sortedItems.length === 0 && <p className="px-4 py-12 text-center text-sm text-[#29384a]/60">Esta carpeta está vacía.</p>}
              {sortedItems.map((item) => (
                <button key={`${item.sourceKind}:${item.provider}:${item.sourceKey}`} type="button" onClick={() => void openItem(item)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#faf8f2] ${selected?.sourceKey === item.sourceKey ? 'bg-[#faf8f2]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#07111d]">{item.subject}</p>
                    <span className="shrink-0 text-[10px] text-[#29384a]/50">{new Date(item.date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#29384a]">{item.counterpart || item.email}</p>
                  {item.snippet && <p className="mt-1 line-clamp-2 text-xs text-[#29384a]/60">{item.snippet}</p>}
                  <div className="mt-2 flex gap-2 text-[10px] text-[#29384a]/50">
                    <span>{item.provider}</span>
                    {item.caseId && <span>· expediente asociado</span>}
                    {item.companyId && <span>· entidad asociada</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="min-h-[420px] overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            {!selected ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-[#29384a]/50">
                <Mail className="h-9 w-9" />
                <p className="text-sm">Selecciona un correo para abrirlo.</p>
              </div>
            ) : selected.sourceKind === 'sent_event' ? (
              <div className="p-5">
                <h2 className="text-base font-semibold text-[#07111d]">{selected.subject}</h2>
                <p className="mt-1 text-xs text-[#29384a]/60">Para: {selected.email} {selected.status ? `· ${selected.status}` : ''}</p>
                {selected.html ? (
                  <iframe title={selected.subject} srcDoc={selected.html} sandbox="allow-popups" referrerPolicy="no-referrer" className="mt-4 h-[62vh] w-full rounded-xl border border-[#f0e9d8] bg-white" />
                ) : (
                  <p className="mt-6 text-sm text-[#29384a]/60">El cuerpo completo de este envío no está almacenado.</p>
                )}
              </div>
            ) : loadingThread ? (
              <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" /></div>
            ) : (
              <div className="max-h-[76vh] space-y-4 overflow-y-auto p-5">
                {messages.length === 0 && <p className="text-sm text-[#29384a]/60">No se pudo recuperar contenido del hilo.</p>}
                {messages.map((msg) => (
                  <article key={msg.id} className="rounded-xl border border-[#f0e9d8] p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#07111d]">{msg.from || msg.fromEmail}</p>
                        <p className="text-[10px] text-[#29384a]/60">Para: {msg.to}</p>
                      </div>
                      <span className="text-[10px] text-[#29384a]/50">{new Date(msg.date).toLocaleString('es-ES')}</span>
                    </div>
                    {msg.bodyType === 'html' ? (
                      <iframe title={`${msg.subject}-${msg.id}`} srcDoc={msg.body} sandbox="allow-popups" referrerPolicy="no-referrer" className="h-96 w-full rounded-lg border border-[#f0e9d8] bg-white" />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[#07111d]">{msg.body}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
