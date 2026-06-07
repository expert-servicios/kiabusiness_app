'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Loader2, Plug, ArrowRight, AlertTriangle, ExternalLink, Zap,
} from 'lucide-react';

interface Props {
  planName     : string;
  holdedConnected: boolean;
  claudeConnected: boolean;
  mcpLaunchUrl  : string;
}

type PollState = 'idle' | 'polling' | 'connected';

export default function PostCompraWizard({
  planName,
  holdedConnected,
  claudeConnected: initialClaudeConnected,
  mcpLaunchUrl,
}: Props) {
  const router = useRouter();
  const [claudeConnected, setClaudeConnected] = useState(initialClaudeConnected);
  const [pollState, setPollState] = useState<PollState>('idle');
  const [completing, setCompleting] = useState(false);

  // Poll for Claude connection after user returns from MCP launch
  const pollMcpStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/holded/mcp-status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json() as { connected: boolean };
      if (data.connected) {
        setClaudeConnected(true);
        setPollState('connected');
      }
    } catch { /* network hiccup — keep polling */ }
  }, []);

  useEffect(() => {
    if (pollState !== 'polling') return;
    const interval = setInterval(() => { void pollMcpStatus(); }, 5_000);
    return () => clearInterval(interval);
  }, [pollState, pollMcpStatus]);

  function handleLaunchClaude() {
    setPollState('polling');
    window.open(mcpLaunchUrl, '_blank', 'noopener');
  }

  async function handleFinish() {
    setCompleting(true);
    try {
      await fetch('/api/dashboard/post-compra/complete', { method: 'POST' });
    } catch { /* non-blocking */ }
    router.push('/dashboard');
  }

  const allDone = holdedConnected && claudeConnected;

  return (
    <div className="min-h-screen bg-[#f8f4eb] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#d7a33a]/20 mb-4">
            <Zap className="h-7 w-7 text-[#d7a33a]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">
            ¡Bienvenido a {planName}!
          </h1>
          <p className="mt-2 text-sm text-[#29384a]/70">
            Completa la configuración para aprovechar al máximo tu plan.
          </p>
        </div>

        {/* Steps card */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm divide-y divide-[#f0e8d5]">

          {/* Step 1 — Holded */}
          <div className="flex items-start gap-4 p-6">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
              ${holdedConnected ? 'bg-green-100' : 'bg-[#f0e8d5]'}`}>
              {holdedConnected
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <span className="text-xs font-bold text-[#29384a]/50">1</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${holdedConnected ? 'text-green-700' : 'text-[#07111d]'}`}>
                Conectar Holded
              </p>
              <p className="mt-0.5 text-xs text-[#29384a]/60">
                {holdedConnected
                  ? 'Tu cuenta de Holded está conectada correctamente.'
                  : 'Necesario para sincronizar tu contabilidad.'}
              </p>
            </div>
            {holdedConnected && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
            )}
          </div>

          {/* Step 2 — Claude */}
          <div className={`flex items-start gap-4 p-6 ${!holdedConnected ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
              ${claudeConnected ? 'bg-green-100' : 'bg-[#d7a33a]/15'}`}>
              {claudeConnected
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <span className="text-xs font-bold text-[#d7a33a]">2</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${claudeConnected ? 'text-green-700' : 'text-[#07111d]'}`}>
                Conectar Holded a Claude
              </p>
              <p className="mt-0.5 text-xs text-[#29384a]/60">
                {claudeConnected
                  ? 'Claude está conectado y puede gestionar tu Holded con IA.'
                  : 'Automatiza facturas, análisis contable y más con IA.'}
              </p>

              {/* CTA */}
              {!claudeConnected && holdedConnected && (
                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleLaunchClaude}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a2e45]"
                  >
                    {pollState === 'polling'
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Esperando conexión…</>
                      : <><Plug className="h-4 w-4" />Conectar Claude<ExternalLink className="h-3 w-3 opacity-60" /></>}
                  </button>

                  {/* Legal microcopy — obligatorio */}
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs leading-relaxed text-amber-800">
                      <strong>Claude es un servicio externo.</strong> La licencia de Claude es obligatoria
                      y se contrata por cuenta del usuario — no está incluida en EXPERT.
                    </p>
                  </div>
                </div>
              )}

              {claudeConnected && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-3" />
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleFinish}
            disabled={completing}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition
              ${allDone
                ? 'bg-[#d7a33a] text-[#061321] hover:bg-[#f0bf54]'
                : 'bg-[#07111d] text-white hover:bg-[#1a2e45]'
              } disabled:opacity-60`}
          >
            {completing && <Loader2 className="h-4 w-4 animate-spin" />}
            {allDone ? 'Ir al dashboard' : 'Continuar al dashboard'}
            {!completing && <ArrowRight className="h-4 w-4" />}
          </button>

          {!allDone && (
            <button
              onClick={handleFinish}
              className="text-xs text-[#29384a]/50 underline-offset-2 hover:text-[#29384a]/70 hover:underline"
            >
              Omitir por ahora — lo configuro más tarde
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
