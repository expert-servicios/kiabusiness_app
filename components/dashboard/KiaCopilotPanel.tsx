'use client';

/**
 * KiaCopilotPanel
 *
 * Floating Kia copilot panel for the client dashboard.
 * Detects the current page and task via usePathname() to provide
 * context-aware proactive suggestions.
 *
 * - Appears as a floating button (bottom-right)
 * - Expands into a chat panel
 * - Auto-sends a proactive greeting on first open based on current page
 * - Sends currentPage + currentTask to /api/kia/copilot
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Loader2, ChevronDown, Sparkles } from 'lucide-react';

// ── Page context mapping ──────────────────────────────────────────────────────

interface PageCtx {
  task       : string;
  proactive  : string; // initial message Kia sends on open
}

const PAGE_CONTEXTS: Array<{ pattern: RegExp; ctx: PageCtx }> = [
  {
    pattern: /^\/dashboard\/empresa\/nueva/,
    ctx: {
      task     : 'creating_company',
      proactive: '¡Hola! Veo que estás añadiendo una empresa. ¿Quieres que busque sus datos fiscales en fuentes públicas (CIF, dirección, razón social)?',
    },
  },
  {
    pattern: /^\/dashboard\/empresa/,
    ctx: {
      task     : 'editing_company',
      proactive: 'Estoy aquí si necesitas ayuda con los datos de tu empresa o quieres que los verifique contra el registro público.',
    },
  },
  {
    pattern: /^\/dashboard\/informes\/[^/]+/,
    ctx: {
      task     : 'viewing_report',
      proactive: '¿Tienes alguna pregunta sobre este informe? Puedo explicarte cualquier cifra o detectar anomalías.',
    },
  },
  {
    pattern: /^\/dashboard\/informes/,
    ctx: {
      task     : 'browsing_reports',
      proactive: '¿Quieres que genere un informe de estado de empresa? Incluye IVA estimado, saldos bancarios, top clientes y alertas contables.',
    },
  },
  {
    pattern: /^\/dashboard\/integraciones\/holded/,
    ctx: {
      task     : 'holded_integration',
      proactive: '¿Necesitas ayuda para conectar Holded? Te guío paso a paso: necesitas la API key de tu cuenta de Holded.',
    },
  },
  {
    pattern: /^\/dashboard\/expedientes\/[^/]+/,
    ctx: {
      task     : 'viewing_case',
      proactive: '¿En qué puedo ayudarte con este expediente? Puedo revisar el estado, los documentos pendientes o explicar los próximos pasos.',
    },
  },
  {
    pattern: /^\/dashboard\/expedientes/,
    ctx: {
      task     : 'browsing_cases',
      proactive: '¿Tienes dudas sobre alguno de tus expedientes? Dime el servicio y te digo en qué punto está.',
    },
  },
  {
    pattern: /^\/dashboard\/suscripciones/,
    ctx: {
      task     : 'viewing_subscriptions',
      proactive: '¿Quieres información sobre tu plan actual o comparar opciones? Puedo explicarte qué incluye cada plan.',
    },
  },
  {
    pattern: /^\/dashboard$/,
    ctx: {
      task     : 'dashboard_home',
      proactive: '¡Hola! Soy Kia, tu asistente de EXPERT. ¿En qué puedo ayudarte hoy?',
    },
  },
];

function getPageCtx(pathname: string): PageCtx {
  for (const { pattern, ctx } of PAGE_CONTEXTS) {
    if (pattern.test(pathname)) return ctx;
  }
  return {
    task     : 'browsing_dashboard',
    proactive: '¡Hola! Soy Kia. ¿En qué puedo ayudarte?',
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role   : 'user' | 'kia';
  text   : string;
  loading?: boolean;
}

interface QuickReply {
  id   : string;
  title: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KiaCopilotPanel() {
  const pathname  = usePathname();
  const pageCtx   = getPageCtx(pathname);

  const [open,       setOpen]       = useState(false);
  const [input,      setInput]      = useState('');
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [proactiveSent, setProactiveSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset proactive flag on page change
  useEffect(() => {
    setProactiveSent(false);
  }, [pathname]);

  // Send proactive message when panel opens
  useEffect(() => {
    if (open && !proactiveSent && messages.length === 0) {
      setProactiveSent(true);
      setMessages([{ role: 'kia', text: pageCtx.proactive }]);
    }
  }, [open, proactiveSent, messages.length, pageCtx.proactive]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: text.trim() };
    const loadingMsg: Message = { role: 'kia', text: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setQuickReplies([]);
    setLoading(true);

    const history = messages
      .filter((m) => !m.loading)
      .slice(-8)
      .map((m) => ({ role: m.role === 'kia' ? 'assistant' : 'user' as const, text: m.text }));

    try {
      const res = await fetch('/api/kia/copilot', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          message    : text.trim(),
          currentPage: pathname,
          currentTask: pageCtx.task,
          history,
        }),
      });
      const data = await res.json() as { message?: string; quickReplies?: QuickReply[]; error?: string };

      setMessages((prev) => [
        ...prev.slice(0, -1), // remove loading
        { role: 'kia', text: data.message ?? data.error ?? 'Lo siento, algo salió mal.' },
      ]);
      setQuickReplies(data.quickReplies ?? []);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'kia', text: 'No pude conectar con el servidor. Inténtalo de nuevo.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, messages, pathname, pageCtx.task]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente Kia"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#c88b25] text-white shadow-lg transition hover:bg-[#b07820] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c88b25]/50"
      >
        {open ? <ChevronDown size={20} /> : <Bot size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-[#e8dfc8] bg-white shadow-2xl sm:w-[380px]">

          {/* Header */}
          <div className="flex items-center justify-between bg-[#c88b25] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-white/80" />
              <div>
                <p className="text-sm font-bold text-white">Kia</p>
                <p className="text-[10px] text-white/70">Asistente EXPERT · {pageCtx.task.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#c88b25] text-white rounded-br-sm'
                    : 'bg-[#f8f4eb] text-[#3d3528] rounded-bl-sm'
                }`}>
                  {msg.loading
                    ? <Loader2 size={14} className="animate-spin text-[#c88b25]" />
                    : msg.text
                  }
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[#f0e8d8] px-4 py-2">
              {quickReplies.map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => sendMessage(qr.title)}
                  disabled={loading}
                  className="rounded-full border border-[#e8dfc8] bg-white px-3 py-1 text-xs font-medium text-[#3d3528] transition hover:bg-[#f8f4eb] disabled:opacity-50"
                >
                  {qr.title}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-[#f0e8d8] px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-[#e8dfc8] bg-[#faf9f6] px-3 py-2 text-sm text-[#3d3528] outline-none placeholder:text-[#c8b89a] focus:border-[#c88b25] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c88b25] text-white transition hover:bg-[#b07820] disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
