'use client';

import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, ExternalLink, KeyRound, Plug, RefreshCw, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  subscriptionId: string;
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
  const prerequisitesReady = onboardingMeetingScheduled && holdedConnected;

  return (
    <div className="min-h-screen bg-[#f8f4eb] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#d7a33a]/20 mb-4"><Zap className="h-7 w-7 text-[#d7a33a]" /></div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">¡Tu {planName} está activo!</h1>
          <p className="mt-2 text-sm text-[#29384a]/70">Completa estos dos pasos antes de la sesión. Después de la reunión, EXPERT validará y cerrará tu alta.</p>
        </div>

        <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm divide-y divide-[#f0e8d5]">
          <div className="flex items-start gap-4 p-6">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${onboardingMeetingScheduled ? 'bg-green-100' : 'bg-[#d7a33a]/15'}`}>
              {onboardingMeetingScheduled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-xs font-bold text-[#d7a33a]">1</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${onboardingMeetingScheduled ? 'text-green-700' : 'text-[#07111d]'}`}>Agendar reunión de onboarding</p>
              <p className="mt-1 text-xs leading-5 text-[#29384a]/65">Antes de la sesión recibirás material de Holded para revisar los conceptos básicos. Así dedicaremos la reunión a tus dudas y a la configuración real de tu empresa.</p>
              {!onboardingMeetingScheduled && <div className="mt-4 flex flex-wrap gap-2"><a href={onboardingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white"><Calendar className="h-4 w-4" />Reservar onboarding<ExternalLink className="h-3.5 w-3.5 opacity-60" /></a><button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-[#d8cbb5] px-4 py-2.5 text-sm font-semibold text-[#29384a]"><RefreshCw className="h-4 w-4" />Ya he reservado</button></div>}
            </div>
          </div>

          <div className={`flex items-start gap-4 p-6 ${!onboardingMeetingScheduled ? 'opacity-50' : ''}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${holdedConnected ? 'bg-green-100' : 'bg-[#d7a33a]/15'}`}>
              {holdedConnected ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-xs font-bold text-[#d7a33a]">2</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${holdedConnected ? 'text-green-700' : 'text-[#07111d]'}`}>Conectar Holded</p>
              <p className="mt-1 text-xs leading-5 text-[#29384a]/65">Conecta Holded por API directa o mediante autorización segura. EXPERT comprobará la conexión antes de cerrar el alta.</p>
              {holdedConnected && <p className="mt-2 text-xs font-medium text-green-700">{directHoldedConnected ? 'API directa conectada.' : 'Conexión autorizada detectada.'}{directHoldedConnected && authorizedHoldedConnected ? ' También hay una conexión autorizada activa.' : ''}</p>}
              {!holdedConnected && onboardingMeetingScheduled && <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href="/dashboard/integraciones/holded" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white"><KeyRound className="h-4 w-4" />Conectar por API</a><a href={holdedAuthorizationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm font-semibold text-[#29384a]"><Plug className="h-4 w-4" />Autorizar Holded<ExternalLink className="h-3.5 w-3.5 opacity-60" /></a></div>}
              {!holdedConnected && onboardingMeetingScheduled && <button type="button" onClick={() => router.refresh()} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#c88b25]"><RefreshCw className="h-3.5 w-3.5" />Volver a comprobar conexión</button>}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#e8dfc8] bg-white px-4 py-3 text-xs leading-5 text-[#6f6254]">No envíes API tokens ni credenciales por email o WhatsApp. La conexión se realiza únicamente desde el área privada o desde la autorización segura de Holded.</div>

        <div className={`mt-6 rounded-2xl border px-5 py-4 ${prerequisitesReady ? 'border-green-200 bg-green-50' : 'border-[#d8cbb5] bg-white'}`}>
          <div className="flex items-start gap-3"><ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${prerequisitesReady ? 'text-green-700' : 'text-[#8a7963]'}`} /><div><p className={`text-sm font-bold ${prerequisitesReady ? 'text-green-800' : 'text-[#07111d]'}`}>{prerequisitesReady ? 'Preparación lista para la reunión' : 'Cierre validado por EXPERT'}</p><p className="mt-1 text-xs leading-5 text-[#6f6254]">Después de celebrar la sesión de onboarding, tu asesor marcará el alta como completada. Recibirás entonces el correo de bienvenida a tu <strong>Espacio de Cliente Responsable EXPERT</strong> y una breve solicitud de valoración del proceso.</p></div></div>
        </div>
      </div>
    </div>
  );
}
