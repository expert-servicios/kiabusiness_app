'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, AlertTriangle, CheckCheck, Phone, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';
import { WaTemplateModal } from './WaTemplateModal';

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
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  if (sameDay) return `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
  return `${dt.getDate()} ${MONTH[dt.getMonth()]}`;
}

function Avatar({ name }: { name: string | null }) {
  const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-sm font-bold text-[#1a9e4a]">
      {initials}
    </div>
  );
}

export function WhatsAppInbox({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  // Mobile: null = show list; desktop: auto-select first
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.phone === selected) ?? null;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: selected ? 'smooth' : 'instant' });
    }
  }, [activeConv?.messages.length, selected]);

  // Focus textarea when opening a conversation on mobile
  useEffect(() => {
    if (selected && window.innerWidth < 1024) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [selected]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch { /* silent */ }
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(loadConversations, 30_000);
    return () => clearInterval(id);
  }, [loadConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSelectConversation = (phone: string) => {
    setSelected(phone);
    setError(null);
    setReply('');
  };

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

      setConversations((prev) => prev.map((c) => {
        if (c.phone !== selected) return c;
        return {
          ...c,
          unread: 0,
          needsReview: false,
          messages: [
            ...c.messages.map((m) => ({ ...m, needs_review: false })),
            {
              id: crypto.randomUUID(),
              direction: 'outbound' as const,
              body: text,
              created_at: new Date().toISOString(),
              needs_review: false,
              ai_responded: false,
              read_at: null,
            },
          ],
        };
      }));
      setReply('');
      textareaRef.current?.focus();
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

  const handleTemplateSent = useCallback((phone: string, previewText: string) => {
    const normalized = phone.replace(/\D/g, '');
    setConversations((prev) => {
      const exists = prev.find((c) => c.phone === normalized);
      if (exists) {
        return prev.map((c) => c.phone !== normalized ? c : {
          ...c,
          messages: [...c.messages, {
            id: crypto.randomUUID(),
            direction: 'outbound' as const,
            body: previewText,
            created_at: new Date().toISOString(),
            needs_review: false,
            ai_responded: false,
            read_at: null,
          }],
          lastAt: new Date().toISOString(),
        });
      }
      return [{
        phone: normalized,
        clientId: null,
        clientName: null,
        clientEmail: null,
        messages: [{
          id: crypto.randomUUID(),
          direction: 'outbound' as const,
          body: previewText,
          created_at: new Date().toISOString(),
          needs_review: false,
          ai_responded: false,
          read_at: null,
        }],
        unread: 0,
        needsReview: false,
        lastAt: new Date().toISOString(),
      }, ...prev];
    });
    setSelected(normalized);
    setShowTemplateModal(false);
    // Refresh after a moment to get real data
    setTimeout(loadConversations, 3000);
  }, [loadConversations]);

  // ── Contact list panel ──────────────────────────────────────
  const ContactList = (
    <aside className={`flex flex-col bg-white
      ${selected ? 'hidden lg:flex' : 'flex'}
      w-full lg:w-72 lg:shrink-0 lg:border-r lg:border-[#d8cbb5]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d8cbb5] px-4 py-3">
        <div>
          <h1 className="font-serif text-base font-bold text-[#07111d]">WhatsApp</h1>
          <p className="mt-0.5 text-xs text-[#29384a]">
            {totalUnread > 0 && <span className="font-semibold text-[#c88b25]">{totalUnread} sin leer · </span>}
            {totalReview > 0 && <span className="font-semibold text-red-600">{totalReview} revisión · </span>}
            {conversations.length} conversaciones
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:bg-[#1da851]"
            title="Nueva conversación"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8] disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <ul className="flex-1 divide-y divide-[#f0e9d8] overflow-y-auto">
        {conversations.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-[#29384a]">
            Sin conversaciones aún.<br />
            <span className="text-xs text-[#29384a]/60">Los mensajes de clientes aparecerán aquí.</span>
          </li>
        )}
        {conversations.map((conv) => (
          <li key={conv.phone}>
            <button
              type="button"
              onClick={() => handleSelectConversation(conv.phone)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-[#f0e9d8] ${
                selected === conv.phone ? 'bg-[#faf8f2]' : 'hover:bg-[#faf8f2]'
              }`}
            >
              <Avatar name={conv.clientName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <p className="truncate text-sm font-semibold text-[#07111d]">
                    {conv.clientName ?? conv.phone}
                  </p>
                  <span className="shrink-0 text-[10px] text-[#29384a]/60">{fmtTime(conv.lastAt)}</span>
                </div>
                {conv.clientName && (
                  <p className="text-xs text-[#29384a]/60">{conv.phone}</p>
                )}
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-[#29384a]">
                    {conv.messages.at(-1)?.body ?? ''}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    {conv.needsReview && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">REVISAR</span>
                    )}
                    {conv.unread > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#25D366] px-1 text-[9px] font-bold text-white">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  // ── Thread panel ─────────────────────────────────────────────
  const ThreadPanel = (
    <div className={`flex flex-col bg-[#ece5dd]
      ${selected ? 'flex' : 'hidden lg:flex'}
      flex-1 min-w-0 min-h-0`}
    >
      {!activeConv ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#29384a]/60">
          <Phone className="h-10 w-10 text-[#d8cbb5]" />
          <p>Selecciona una conversación</p>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b border-black/10 bg-[#075e54] px-4 py-2.5">
            {/* Back button — mobile only */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 lg:hidden"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Avatar name={activeConv.clientName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {activeConv.clientName ?? activeConv.phone}
              </p>
              <p className="truncate text-xs text-white/70">
                {activeConv.phone}
                {activeConv.clientId && (
                  <> · <Link href={`/admin/clientes/${activeConv.clientId}`} className="underline">Ver ficha</Link></>
                )}
              </p>
            </div>
            {activeConv.needsReview && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-200">
                <AlertTriangle className="h-3 w-3" /> REVISAR
              </span>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {activeConv.messages.map((msg, i) => {
              const isOut = msg.direction === 'outbound';
              const prev = activeConv.messages[i - 1];
              const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="my-2 text-center">
                      <span className="rounded-full bg-black/10 px-3 py-1 text-[10px] text-[#29384a]">
                        {fmtTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isOut
                        ? 'rounded-tr-sm bg-[#dcf8c6] text-[#07111d]'
                        : msg.needs_review
                          ? 'rounded-tl-sm border border-red-200 bg-red-50 text-[#07111d]'
                          : 'rounded-tl-sm bg-white text-[#07111d]'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div className={`mt-1 flex items-center gap-1 text-[10px] text-[#29384a]/60 ${isOut ? 'justify-end' : 'justify-start'}`}>
                        {isOut && msg.ai_responded && (
                          <Bot className="h-3 w-3" />
                        )}
                        {isOut && !msg.ai_responded && (
                          <User className="h-3 w-3" />
                        )}
                        <span>{fmtTime(msg.created_at)}</span>
                        {isOut && <CheckCheck className="h-3 w-3 text-[#25D366]" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <div className="wa-reply-bar flex items-end gap-2 border-t border-black/10 bg-[#f0f2f5] px-3 py-2">
            {error && (
              <p className="absolute bottom-full left-0 right-0 bg-red-50 px-4 py-1 text-xs text-red-600">
                {error}
              </p>
            )}
            <textarea
              ref={textareaRef}
              value={reply}
              onChange={(e) => {
                setReply(e.target.value);
                // Auto-grow
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKey}
              placeholder="Escribe un mensaje"
              rows={1}
              className="wa-textarea flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-2.5 text-sm text-[#07111d] outline-none placeholder:text-[#29384a]/50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !reply.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow transition hover:bg-[#1da851] disabled:opacity-50 active:scale-95"
              aria-label="Enviar"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* h-dvh minus the admin mobile topbar (3rem ≈ 48px); on desktop h-screen fills alongside sidebar */}
      <div className="flex h-[calc(100dvh-3rem)] overflow-hidden lg:h-screen">
        {ContactList}
        {ThreadPanel}
      </div>
      {showTemplateModal && (
        <WaTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSent={handleTemplateSent}
        />
      )}
    </>
  );
}
