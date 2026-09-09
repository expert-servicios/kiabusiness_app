'use client';

/**
 * IMP-022: KIA copiloto flotante in-app.
 *
 * Botón fijo en esquina inferior derecha del portal (admin y dashboard cliente).
 * Al hacer clic abre un panel de chat sin salir de la página actual.
 * Llama a POST /api/ai/kia con el mensaje y la ruta actual.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import { KiaAvatar } from '@/components/kia/KiaAvatar';
import type { KiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import type { KiaCopilotArtifact } from '@/lib/ai/kia/kia-copilot-artifacts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  avatarState?: KiaAvatarState;
  artifacts?: KiaCopilotArtifact[];
}

interface KiaApiResponse {
  reply: string;
  quickReplies?: string[];
  intent?: string;
  nextAction?: string;
  avatarState?: KiaAvatarState;
  artifacts?: KiaCopilotArtifact[];
  error?: string;
}

function welcomeMessage(returning = false): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: returning
      ? '¡Hola de nuevo! ¿En qué te ayudo?'
      : '¡Hola! Soy KIA, tu copiloto en EXPERT. Puedo ayudarte con tus expedientes, empresas conectadas, Holded y cualquier consulta fiscal o legal. ¿En qué te ayudo?',
    quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
    avatarState: 'bienvenida',
  };
}

function useKiaChat(pathname: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage()]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleCompanyChanged = () => {
      setMessages([welcomeMessage(true)]);
      setSessionId(undefined);
      setLoading(false);
    };

    window.addEventListener('expert:active-company-changed', handleCompanyChanged);
    return () => window.removeEventListener('expert:active-company-changed', handleCompanyChanged);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    // The dashboard has no phone-backed WhatsApp history. Send only the last
    // few visible turns as bounded conversational context; server auth/company
    // scope remains authoritative for every data/tool operation.
    const history = messages
      .slice(-8)
      .filter((message) => message.text.trim())
      .map((message) => ({
        role: message.role,
        text: message.text.slice(0, 1200),
      }));

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
          history,
        }),
      });

      const data: KiaApiResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id          : crypto.randomUUID(),
        role        : 'assistant',
        text        : data.reply ?? 'Lo siento, no pude procesar tu consulta.',
        quickReplies: data.quickReplies?.length ? data.quickReplies : undefined,
        avatarState : data.avatarState ?? (data.error ? 'aviso' : 'ayuda'),
        artifacts   : data.artifacts?.length ? data.artifacts : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);

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
          avatarState: 'aviso',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, pathname, sessionId]);

  const reset = useCallback(() => {
    setMessages([welcomeMessage(true)]);
    setSessionId(undefined);
  }, []);

  return { messages, loading, send, reset };
}

function KiaMessageArtifacts({ artifacts }: { artifacts: KiaCopilotArtifact[] }) {
  return (
    <div className="mt-2 space-y-2">
      {artifacts.map((artifact, index) => {
        if (artifact.type === 'table') {
          return (
            <div
              key={`${artifact.type}-${index}`}
              className="overflow-hidden rounded-xl border border-[#e8e0d4] bg-white"
            >
              <p className="border-b border-[#e8e0d4] px-2.5 py-2 text-xs font-semibold text-[#3d3528]">
                {artifact.title}
              </p>
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full text-left text-[11px] text-[#3d3528]">
                  <thead className="bg-[#faf8f4] text-[#7a6e5f]">
                    <tr>
                      {artifact.columns.map((column) => (
                        <th key={column} className="whitespace-nowrap px-2.5 py-1.5 font-medium">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {artifact.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-[#f0ebe3]">
                        {artifact.columns.map((column) => (
                          <td key={column} className="max-w-[160px] px-2.5 py-1.5 align-top">
                            <span className="line-clamp-2">{String(row[column] ?? '—')}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return (
          <a
            key={`${artifact.type}-${index}`}
            href={artifact.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl border bg-white px-3 py-2 text-xs shadow-sm transition-colors hover:border-[#0D1B2A] ${
              artifact.type === 'link' && artifact.tone === 'warning'
                ? 'border-amber-300'
                : 'border-[#e8e0d4]'
            }`}
          >
            <span className="font-semibold text-[#3d3528]">{artifact.title}</span>
            {artifact.type === 'report' && artifact.period ? (
              <span className="ml-1 text-[#7a6e5f]">· {artifact.period}</span>
            ) : null}
            <span className="mt-1 flex items-center gap-1 font-medium text-[#0D1B2A]">
              {artifact.cta} <ExternalLink size={11} aria-hidden="true" />
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default function KiaCopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const pathname = usePathname();
  const { messages, loading, send, reset } = useKiaChat(pathname);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
  const currentKiaState: KiaAvatarState = loading
    ? 'pensando'
    : (lastAssistantMessage?.avatarState ?? 'bienvenida');

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

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
      {open && (
        <div
          id="kia-copilot-panel"
          role="dialog"
          aria-label="KIA copiloto"
          aria-modal="false"
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
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: '#0D1B2A', borderRadius: '16px 16px 0 0' }}
          >
            <div className="flex items-center gap-2">
              <KiaAvatar state={currentKiaState} size="sm" priority animateOnChange />
              <div>
                <p className="text-sm font-semibold text-white">KIA</p>
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
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
                aria-label="Cerrar KIA copiloto"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 overflow-y-auto px-4 py-3"
            style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' ? (
                  <KiaAvatar state={msg.avatarState ?? 'ayuda'} size="xs" className="mt-0.5" />
                ) : null}
                <div style={{ maxWidth: msg.role === 'user' ? '85%' : '78%' }}>
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
                  {msg.role === 'assistant' && msg.artifacts?.length ? (
                    <KiaMessageArtifacts artifacts={msg.artifacts} />
                  ) : null}
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
              <div
                role="status"
                aria-label="KIA está revisando tu consulta"
                className="flex items-start justify-start gap-2"
              >
                <KiaAvatar state="pensando" size="xs" className="mt-0.5" />
                <div
                  className="flex items-center gap-1 rounded-2xl px-3 py-2 text-sm"
                  style={{ background: '#f5f1eb', color: '#7a6e5f', borderBottomLeftRadius: '4px' }}
                >
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  <span>Pensando…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
              aria-label="Escribe tu consulta a KIA"
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
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? 'Cerrar KIA' : 'Abrir KIA copiloto'}
        aria-expanded={open}
        aria-controls="kia-copilot-panel"
        className="fixed bottom-[72px] right-4 z-[200] lg:bottom-4 flex items-center justify-center overflow-hidden rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          width     : '56px',
          height    : '56px',
          background: open ? '#3d3528' : '#fff',
          color     : '#fff',
          border    : open ? 'none' : '2px solid #0D1B2A',
        }}
      >
        {open ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <KiaAvatar state={currentKiaState} size="lg" animateOnChange />
        )}
      </button>
    </>
  );
}
