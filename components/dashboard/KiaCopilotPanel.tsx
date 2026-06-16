'use client';

/**
 * Floating Kia copilot panel for the client dashboard.
 *
 * The panel sends page context to /api/kia/copilot and can render lightweight
 * artifacts returned by Kia tools: report links, secure links and small tables.
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  ChevronDown,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Send,
  Sparkles,
  Table2,
  X,
} from 'lucide-react';

interface PageCtx {
  task: string;
  proactive: string;
}

const PAGE_CONTEXTS: Array<{ pattern: RegExp; ctx: PageCtx }> = [
  {
    pattern: /^\/dashboard\/empresa\/nueva/,
    ctx: {
      task: 'creating_company',
      proactive:
        'Hola, soy Kia, asistente virtual de EXPERT. Veo que estas anadiendo una empresa. Puedo ayudarte a revisar datos fiscales y fuentes publicas antes de guardarla.',
    },
  },
  {
    pattern: /^\/dashboard\/empresa/,
    ctx: {
      task: 'editing_company',
      proactive:
        'Soy Kia. Estoy aqui si necesitas revisar datos de empresa, fuentes publicas o coherencia fiscal.',
    },
  },
  {
    pattern: /^\/dashboard\/informes\/[^/]+/,
    ctx: {
      task: 'viewing_report',
      proactive:
        'Soy Kia. Puedes preguntarme por cualquier cifra de este informe; tambien puedo ayudarte a detectar anomalias.',
    },
  },
  {
    pattern: /^\/dashboard\/informes/,
    ctx: {
      task: 'browsing_reports',
      proactive:
        'Soy Kia. Puedo generar un informe visual con datos de Holded: IVA estimado, ventas, gastos, bancos, clientes principales y alertas.',
    },
  },
  {
    pattern: /^\/dashboard\/estado-empresa/,
    ctx: {
      task: 'company_status_dashboard',
      proactive:
        'Soy Kia. Estoy preparada para explicar este Estado de empresa o generar un informe visual con graficos a partir de Holded.',
    },
  },
  {
    pattern: /^\/dashboard\/integraciones\/holded/,
    ctx: {
      task: 'holded_integration',
      proactive:
        'Soy Kia. Te guio para conectar Holded desde el Panel Cliente seguro; no hace falta enviar claves por chat.',
    },
  },
  {
    pattern: /^\/dashboard\/expedientes\/[^/]+/,
    ctx: {
      task: 'viewing_case',
      proactive:
        'Soy Kia. Puedo revisar el estado del expediente, documentos pendientes o proximos pasos.',
    },
  },
  {
    pattern: /^\/dashboard\/expedientes/,
    ctx: {
      task: 'browsing_cases',
      proactive:
        'Soy Kia. Si tienes dudas sobre un expediente, dime cual y reviso el siguiente paso util.',
    },
  },
  {
    pattern: /^\/dashboard\/suscripciones/,
    ctx: {
      task: 'viewing_subscriptions',
      proactive:
        'Soy Kia. Puedo explicarte tu plan actual, comparar opciones o revisar si Holded esta preparado.',
    },
  },
  {
    pattern: /^\/dashboard$/,
    ctx: {
      task: 'dashboard_home',
      proactive:
        'Hola, soy Kia, asistente virtual de EXPERT. Estoy preparada para ayudarte con expedientes, Holded, informes o servicios.',
    },
  },
];

function getPageCtx(pathname: string): PageCtx {
  for (const { pattern, ctx } of PAGE_CONTEXTS) {
    if (pattern.test(pathname)) return ctx;
  }
  return {
    task: 'browsing_dashboard',
    proactive:
      'Hola, soy Kia, asistente virtual de EXPERT. Cuentame que necesitas y te guio paso a paso.',
  };
}

type CopilotArtifact =
  | { type: 'report'; title: string; url: string; period?: string; cta: string }
  | { type: 'table'; title: string; columns: string[]; rows: Array<Record<string, unknown>> }
  | { type: 'link'; title: string; url: string; cta: string; tone?: 'warning' | 'info' };

interface Message {
  role: 'user' | 'kia';
  text: string;
  artifacts?: CopilotArtifact[];
  loading?: boolean;
}

interface QuickReply {
  id: string;
  title: string;
}

export function KiaCopilotPanel() {
  const pathname = usePathname();
  const pageCtx = getPageCtx(pathname);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight SSE stream when the component unmounts
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleToggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && messages.length === 0) {
      setMessages([{ role: 'kia', text: pageCtx.proactive }]);
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || loading) return;

    const userMsg: Message = { role: 'user', text: cleanText };
    const loadingMsg: Message = { role: 'kia', text: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setQuickReplies([]);
    setLoading(true);

    const history = messages
      .filter((message) => !message.loading)
      .slice(-8)
      .map((message) => ({
        role: message.role === 'kia' ? 'assistant' as const : 'user' as const,
        text: message.text,
      }));

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/kia/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: cleanText, currentPage: pathname, currentTask: pageCtx.task, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      setMessages((prev) => [...prev.slice(0, -1), { role: 'kia', text: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let streamedText = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let ev: { type?: string; text?: string; artifacts?: CopilotArtifact[]; quickReplies?: QuickReply[]; error?: string };
          try { ev = JSON.parse(raw) as typeof ev; } catch { continue; }

          if (ev.type === 'chunk' && ev.text) {
            streamedText += ev.text;
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: 'kia', text: streamedText, loading: false },
            ]);
          }

          if (ev.type === 'done') {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: 'kia', text: streamedText || '—', loading: false, artifacts: ev.artifacts ?? [] },
            ]);
            setQuickReplies(ev.quickReplies ?? []);
            break outer;
          }

          if (ev.type === 'error') {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: 'kia', text: ev.error ?? 'Error interno. Intentalo de nuevo.' },
            ]);
            break outer;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'kia', text: 'No pude conectar con el servidor. Intentalo de nuevo.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, messages, pathname, pageCtx.task]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Abrir asistente Kia"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#c88b25] text-white shadow-lg transition hover:scale-105 hover:bg-[#b07820] focus:outline-none focus:ring-2 focus:ring-[#c88b25]/50"
      >
        {open ? <ChevronDown size={20} /> : <Bot size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-[#e8dfc8] bg-white shadow-2xl sm:w-[380px]">
          <div className="flex items-center justify-between bg-[#c88b25] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-white/80" />
              <div>
                <p className="text-sm font-bold text-white">Kia</p>
                <p className="text-[10px] text-white/70">
                  Asistente EXPERT · {pageCtx.task.replace(/_/g, ' ')}
                </p>
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

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 max-h-80">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'rounded-br-sm bg-[#c88b25] text-white'
                    : 'rounded-bl-sm bg-[#f8f4eb] text-[#3d3528]'
                }`}>
                  {message.loading ? (
                    <Loader2 size={14} className="animate-spin text-[#c88b25]" />
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      {message.artifacts && message.artifacts.length > 0 && (
                        <CopilotArtifacts artifacts={message.artifacts} />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[#f0e8d8] px-4 py-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => sendMessage(reply.title)}
                  disabled={loading}
                  className="rounded-full border border-[#e8dfc8] bg-white px-3 py-1 text-xs font-medium text-[#3d3528] transition hover:bg-[#f8f4eb] disabled:opacity-50"
                >
                  {reply.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end px-4 py-1.5 border-t border-[#f0e8d8]">
            <a
              href="/dashboard/kia-ayuda"
              className="text-[10px] text-[#c8b89a] hover:text-[#c88b25] transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cómo usar Kia →
            </a>
          </div>

          <div className="flex items-end gap-2 border-t border-[#f0e8d8] px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
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

function CopilotArtifacts({ artifacts }: { artifacts: CopilotArtifact[] }) {
  return (
    <div className="mt-2 space-y-2">
      {artifacts.map((artifact, index) => {
        if (artifact.type === 'report') {
          return (
            <a
              key={`${artifact.type}-${index}`}
              href={artifact.url}
              className="block rounded-xl border border-[#d8cbb5] bg-white p-3 text-[#3d3528] shadow-sm transition hover:border-[#c88b25]"
            >
              <div className="flex items-start gap-2">
                <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#c88b25]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{artifact.title}</p>
                  {artifact.period && <p className="mt-0.5 text-[10px] text-[#7a6e5f]">{artifact.period}</p>}
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#a97320]">
                    {artifact.cta} <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </a>
          );
        }

        if (artifact.type === 'link') {
          return (
            <a
              key={`${artifact.type}-${index}`}
              href={artifact.url}
              className={`block rounded-xl border p-3 shadow-sm transition ${
                artifact.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300'
                  : 'border-[#d8cbb5] bg-white text-[#3d3528] hover:border-[#c88b25]'
              }`}
            >
              <div className="flex items-start gap-2">
                <LinkIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{artifact.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
                    {artifact.cta} <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </a>
          );
        }

        return (
          <div
            key={`${artifact.type}-${index}`}
            className="rounded-xl border border-[#d8cbb5] bg-white p-3 text-[#3d3528] shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <Table2 className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold">{artifact.title}</p>
            </div>
            <div className="max-h-40 overflow-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-[#7a6e5f]">
                    {artifact.columns.map((column) => (
                      <th key={column} className="pb-1 pr-2 font-semibold">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8d8]">
                  {artifact.rows.slice(0, 6).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {artifact.columns.map((column) => (
                        <td key={column} className="py-1 pr-2">{String(row[column] ?? '-')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
