'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Calendar, CheckCircle2, ExternalLink, KeyRound, Loader2, Plug, RefreshCw, Zap } from 'lucide-react';

interface Props {
  planName: string;
  onboardingMeetingScheduled: boolean;
  onboardingUrl: string;
  holdedConnected: boolean;
  directHoldedConnected: boolean;
  authorizedHoldedConnected: boolean;
  holdedAuthorizationUrl: string;
}

export default function PostCompraWizard({
  planName,
  onboardingMeetingScheduled,
  onboardingUrl,
  holdedConnected,
  directHoldedConnected,
  authorizedHoldedConnected,
  holdedAuthorizationUrl,
}: Props) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const allDone = onboardingMeetingScheduled && holdedConnected;

  async function handleFinish() {
    if (!allDone) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const res = await fetch('/api/dashboard/post-compra/complete', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setCompleteError(`No se pudo completar el onboarding (${msg}). Inténtalo de nuevo.`);
      setCompleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f4eb] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#d7a33a]/20 mb-4">
            <Zap className="h-7 w-7 text-[#d7a33a]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">¡Tu {planName} está activo!</h1>
          <p className="mt-2 text-sm text-[#29384a]/70">
            Completa estos dos pasos para cerrar el alta y empezar la gestión con EXPERT.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm divide-y divide-[#f0e8d5]">
          <div className="flex items-start gap-4 p-6">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${onboardingMeetingScheduled ? 'bg-green-100' : 'bg-[#d7a33a]/15'}`}>
              {onboardingMeetingScheduled
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <span className="text-xs font-bold text-[#d7a33a]">1</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${onboardingMeetingScheduled ? 'text-green-700' : 'text-[#07111d]'}`}>
                Agendar reunión de onboarding
              </p>
              <p className="mt-1 text-xs leading-5 text-[#29384a]/65">
                Revisaremos el alcance del plan, la operativa de tu empresa y dejaremos definidos los siguientes pasos.
              </p>
              {!onboardingMeetingScheduled && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={onboardingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2e45]">
                    <Calendar className="h-4 w-4" />
                    Reservar onboarding
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                  <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-[#d8cbb5] px-4 py-2.5 text-sm font-semibold text-[#29384a]">
                    <RefreshCw className="h-4 w-4" />
                    Ya he reservado
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-start gap-4 p-6 ${!onboardingMeetingScheduled ? 'opacity-50' : ''}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${holdedConnected ? 'bg-green-100' : 'bg-[#d7a33a]/15'}`}>
              {holdedConnected
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <span className="text-xs font-bold text-[#d7a33a]">2</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${holdedConnected ? 'text-green-700' : 'text-[#07111d]'}`}>
                Conectar Holded
              </p>
              <p className="mt-1 text-xs leading-5 text-[#29384a]/65">
                Puedes conectar Holded mediante API directa o mediante autorización segura con token de acceso. EXPERT valida la conexión antes de cerrar el onboarding.
              </p>

              {holdedConnected && (
                <p className="mt-2 text-xs font-medium text-green-700">
                  {directHoldedConnected ? 'API directa conectada.' : 'Conexión autorizada con token de acceso detectada.'}
                  {directHoldedConnected && authorizedHoldedConnected ? ' También hay una conexión autorizada activa.' : ''}
                </p>
              )}

              {!holdedConnected && onboardingMeetingScheduled && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a href="/dashboard/integraciones/holded" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2e45]">
                    <KeyRound className="h-4 w-4" />
                    Conectar por API
                  </a>
                  <a href={holdedAuthorizationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
                    <Plug className="h-4 w-4" />
                    Autorizar Holded
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              )}

              {!holdedConnected && onboardingMeetingScheduled && (
                <button type="button" onClick={() => router.refresh()} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#c88b25]">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Volver a comprobar conexión
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#e8dfc8] bg-white px-4 py-3 text-xs leading-5 text-[#6f6254]">
          No envíes API tokens ni credenciales por email o WhatsApp. La conexión se realiza únicamente desde el área privada o desde la autorización segura de Holded.
        </div>

        {completeError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{completeError}</p>}

        <button type="button" onClick={handleFinish} disabled={!allDone || completing} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] px-6 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:cursor-not-allowed disabled:opacity-50">
          {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Finalizar onboarding
          {!completing && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
