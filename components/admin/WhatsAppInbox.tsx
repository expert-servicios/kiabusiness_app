'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, CheckCheck, Phone } from 'lucide-react';
import Link from 'next/link';

interface WaMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
  needs_review: boolean;
  ai_responded: boolean;
  read_at: string | null;
}

interface Conversation {
  phone: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  messages: WaMessage[];
  unread: number;
  needsReview: boolean;
  lastAt: string;
}

const MONTH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtTime(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH[dt.getMonth()]} ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
}

export function WhatsAppInbox({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState<string | null>(initialConversations[0]?.phone ?? null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.phone === selected) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !selected) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selected, body: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return; }

      // Optimistic update
      setConversations((prev) => prev.map((c) => {
        if (c.phone !== selected) return c;
        return {
          ...c,
          unread: 0,
          needsReview: false,
          messages: [...c.messages.map((m) => ({ ...m, needs_review: false })), {
            id: crypto.randomUUID(),
            direction: 'outbound' as const,
            body: text,
            created_at: new Date().toISOString(),
            needs_review: false,
            ai_responded: false,
            read_at: null,
          }],
        };
      }));
      setReply('');
    } catch {
      setError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const totalReview = conversations.filter((c) => c.needsReview).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* Sidebar — contact list */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-[#d8cbb5] bg-white">
        <div className="border-b border-[#d8cbb5] px-4 py-3">
          <h1 className="font-serif text-base font-bold text-[#07111d]">WhatsApp</h1>
          <div className="mt-1 flex gap-3 text-xs text-[#29384a]">
            {totalUnread > 0 && <span className="font-semibold text-[#c88b25]">{totalUnread} sin leer</span>}
            {totalReview > 0 && <span className="font-semibold text-red-600">{totalReview} pendiente{totalReview > 1 ? 's' : ''} revisión</span>}
            {totalUnread === 0 && totalReview === 0 && <span>Todo al día</span>}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-[#29384a]">Sin conversaciones aún.</li>
          )}
          {conversations.map((conv) => (
            <li key={conv.phone}>
              <button
                type="button"
                onClick={() => setSelected(conv.phone)}
                className={`w-full border-b border-[#f0e9d8] px-4 py-3 text-left transition hover:bg-[#faf8f2] ${selected === conv.phone ? 'bg-[#faf8f2]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#07111d]">
                      {conv.clientName ?? conv.phone}
                    </p>
                    {conv.clientName && (
                      <p className="truncate text-xs text-[#29384a]">{conv.phone}</p>
                    )}
                    <p className="mt-1 truncate text-xs text-[#29384a]">
                      {conv.messages.at(-1)?.body ?? ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[10px] text-[#29384a]">{fmtTime(conv.lastAt)}</span>
                    {conv.needsReview && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">REVISAR</span>
                    )}
                    {conv.unread > 0 && !conv.needsReview && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] text-[9px] font-bold text-white">{conv.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main — message thread */}
      <div className="flex flex-1 flex-col bg-[#f8f4eb]">
        {!activeConv ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#29384a]">
            Selecciona una conversación
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-[#d8cbb5] bg-white px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#07111d]">{activeConv.clientName ?? activeConv.phone}</p>
                <p className="text-xs text-[#29384a]">
                  {activeConv.phone}
                  {activeConv.clientId && (
                    <> · <Link href={`/admin/clientes/${activeConv.clientId}`} className="text-[#c88b25] hover:underline">Ver ficha</Link></>
                  )}
                </p>
              </div>
              {activeConv.needsReview && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Pendiente tu revisión
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {activeConv.messages.map((msg) => {
                const isOut = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] flex-col gap-1`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isOut
                          ? 'bg-[#dcf8c6] text-[#07111d]'
                          : msg.needs_review
                            ? 'border border-red-200 bg-red-50 text-[#07111d]'
                            : 'bg-white text-[#07111d] shadow-sm'
                      }`}>
                        {msg.body}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] text-[#29384a] ${isOut ? 'justify-end' : 'justify-start'}`}>
                        {isOut && msg.ai_responded && (
                          <span className="flex items-center gap-0.5 text-[#29384a]/60">
                            <Bot className="h-3 w-3" /> IA
                          </span>
                        )}
                        {isOut && !msg.ai_responded && (
                          <span className="flex items-center gap-0.5 text-[#29384a]/60">
                            <User className="h-3 w-3" /> Tú
                          </span>
                        )}
                        {fmtTime(msg.created_at)}
                        {isOut && <CheckCheck className="h-3 w-3 text-[#25D366]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-[#d8cbb5] bg-white px-4 py-3">
              {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
              <div className="flex gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escribe tu respuesta... (Ctrl+Enter para enviar)"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#25D366]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
