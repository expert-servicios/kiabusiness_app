'use client';

/**
 * IMP-022: Kia copiloto flotante in-app.
 *
 * Botón fijo en esquina inferior derecha del portal (admin y dashboard cliente).
 * Al hacer clic abre un panel de chat sin salir de la página actual.
 * Llama a POST /api/ai/kia con el mensaje y la ruta actual.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Loader2, Bot, ChevronDown } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
}

interface KiaApiResponse {
  reply: string;
  quickReplies?: string[];
  intent?: string;
  nextAction?: string;
  error?: string;
}

// ── Hook de chat ──────────────────────────────────────────────────────────────

function useKiaChat(pathname: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Soy Kia, tu copiloto en EXPERT. Puedo ayudarte con tus expedientes, empresas conectadas, Holded y cualquier consulta fiscal o legal. ¿En qué te ayudo?',
      quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/kia', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          message    : text,
          sessionId,
          currentPage: pathname,
        }),
      });

      const data: KiaApiResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id          : crypto.randomUUID(),
        role        : 'assistant',
        text        : data.reply ?? 'Lo siento, no pude procesar tu consulta.',
        quickReplies: data.quickReplies?.length ? data.quickReplies : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Guardar sessionId para las siguientes llamadas
      if (!sessionId && res.headers.get('x-kia-session-id')) {
        setSessionId(res.headers.get('x-kia-session-id') ?? undefined);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id  : crypto.randomUUID(),
          role: 'assistant',
          text: 'Tengo un problema técnico en este momento. Inténtalo de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, pathname, sessionId]);

  const reset = useCallback(() => {
    setMessages([
      {
        id         : 'welcome',
        role       : 'assistant',
        text       : '¡Hola de nuevo! ¿En qué te ayudo?',
        quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
      },
    ]);
    setSessionId(undefined);
  }, []);

  return { messages, loading, send, reset };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function KiaCopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const pathname = usePathname();
  const { messages, loading, send, reset } = useKiaChat(pathname);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Focus al input cuando se abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(text: string) {
    send(text);
  }

  return (
    <>
      {/* ── Panel de chat ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[132px] right-4 z-[200] lg:bottom-20 flex flex-col"
          style={{
            width         : 'min(380px, calc(100vw - 32px))',
            height        : 'min(560px, calc(100vh - 148px))',
            background    : '#fff',
            borderRadius  : '16px',
            boxShadow     : '0 8px 32px rgba(13,27,42,0.18)',
            border        : '1px solid #e8e0d4',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: '#0D1B2A', borderRadius: '16px 16px 0 0' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: '#c88b25' }}
              >
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Kia</p>
                <p className="text-xs" style={{ color: '#9ba8b4' }}>Copiloto EXPERT</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                title="Nueva conversación"
                className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
                aria-label="Nueva conversación"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3" style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div style={{ maxWidth: '85%' }}>
                  <div
                    className="rounded-2xl px-3 py-2 text-sm"
                    style={
                      msg.role === 'user'
                        ? { background: '#0D1B2A', color: '#fff', borderBottomRightRadius: '4px' }
                        : { background: '#f5f1eb', color: '#07111d', borderBottomLeftRadius: '4px' }
                    }
                  >
                    {msg.text}
                  </div>
                  {/* Quick replies */}
                  {msg.role === 'assistant' && msg.quickReplies?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => handleQuickReply(qr)}
                          className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-[#f5f1eb]"
                          style={{ borderColor: '#c8b89a', color: '#3d3528' }}
                          disabled={loading}
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1 rounded-2xl px-3 py-2 text-sm"
                  style={{ background: '#f5f1eb', color: '#7a6e5f', borderBottomLeftRadius: '4px' }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span>Pensando…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-end gap-2 px-3 py-3"
            style={{ borderTop: '1px solid #e8e0d4' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-[#0D1B2A] disabled:opacity-50"
              style={{
                borderColor: '#e8e0d4',
                maxHeight  : '96px',
                lineHeight : '1.4',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
              style={{ background: '#0D1B2A', color: '#fff' }}
              aria-label="Enviar"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Botón flotante ─────────────────────────────────────────────────── */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? 'Cerrar Kia' : 'Abrir Kia copiloto'}
        className="fixed bottom-[72px] right-4 z-[200] lg:bottom-4 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          width     : '52px',
          height    : '52px',
          background: open ? '#3d3528' : '#0D1B2A',
          color     : '#fff',
        }}
      >
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>
    </>
  );
}
