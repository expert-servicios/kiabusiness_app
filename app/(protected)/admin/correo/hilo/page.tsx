'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, RefreshCw, Send } from 'lucide-react';

type Provider = 'gmail' | 'ms365';

type ThreadMessage = {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  bodyType: 'html' | 'text';
  unread: boolean;
};

export default function CorreoThreadPage() {
  const searchParams = useSearchParams();
  const providerParam = searchParams.get('provider');
  const provider: Provider | null = providerParam === 'gmail' || providerParam === 'ms365' ? providerParam : null;
  const conversationId = searchParams.get('conversationId') ?? '';
  const clientId = searchParams.get('clientId');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!provider || !conversationId) {
      setError('Falta proveedor o identificador de conversación.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ action: 'conversation', provider, conversationId });
      const response = await fetch(`/api/admin/correo?${params}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo abrir el hilo');
        return;
      }
      setMessages(json.messages ?? []);
    } catch {
      setError('Error de conexión al abrir el hilo');
    } finally {
      setLoading(false);
    }
  }, [provider, conversationId]);

  useEffect(() => { void load(); }, [load]);

  const lastMessage = messages.at(-1);
  const lastInbound = [...messages].reverse().find((message) => message.fromEmail && message.fromEmail !== lastMessage?.to);

  const sendReply = async () => {
    if (!provider || !conversationId || !reply.trim() || !lastMessage?.id) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          provider,
          messageId: lastMessage.id,
          comment: reply.trim(),
          conversationId,
          subject: lastMessage.subject,
          clientEmail: lastInbound?.fromEmail ?? lastMessage.fromEmail,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo enviar la respuesta');
        return;
      }
      setReply('');
      await load();
    } catch {
      setError('Error de conexión al responder');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb] p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={clientId ? `/admin/clientes/${clientId}/comunicaciones` : '/admin/correo'} className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#29384a] hover:border-[#c88b25]" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c88b25]">Correo 360</p>
              <h1 className="font-serif text-xl font-bold text-[#07111d]">{lastMessage?.subject ?? 'Conversación'}</h1>
              <p className="text-xs text-[#8a9aab]">{provider === 'gmail' ? 'Gmail' : provider === 'ms365' ? 'Microsoft 365' : 'Proveedor no identificado'}</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-[#c88b25]" /></div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-[#8a9aab]"><Mail className="h-8 w-8" /><p className="text-sm">No hay mensajes disponibles.</p></div>
          ) : (
            <div className="max-h-[68vh] space-y-4 overflow-y-auto p-5">
              {messages.map((message) => (
                <article key={message.id} className="rounded-xl border border-[#f0e8d8] p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#07111d]">{message.from || message.fromEmail}</p>
                      <p className="text-[10px] text-[#8a9aab]">Para: {message.to}</p>
                    </div>
                    <time className="text-[10px] text-[#8a9aab]">{new Date(message.date).toLocaleString('es-ES')}</time>
                  </div>
                  {message.bodyType === 'html' ? (
                    <iframe title={`${message.subject}-${message.id}`} srcDoc={message.body} sandbox="" referrerPolicy="no-referrer" className="h-96 w-full rounded-lg border border-[#f0e8d8] bg-white" />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#29384a]">{message.body}</p>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="border-t border-[#d8cbb5] bg-[#fbf8f2] p-4">
            <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} placeholder="Responder a este hilo..." className="w-full resize-none rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#c88b25]" />
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => void sendReply()} disabled={sending || loading || !reply.trim() || !lastMessage?.id} className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Send className="h-4 w-4" /> {sending ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
