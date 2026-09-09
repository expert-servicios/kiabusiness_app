'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { KiaAvatar } from '@/components/kia/KiaAvatar';
import {
  KIA_AVATAR_LABELS,
  KIA_AVATAR_STATES,
  type KiaAvatarState,
} from '@/lib/ai/kia/kia-avatar-state';
import { resolveKiaAvatarMotion } from '@/lib/ai/kia/kia-avatar-motion';

const USAGE: Record<KiaAvatarState, string> = {
  bienvenida: 'Inicio de sesión o conversación',
  ayuda: 'Orientación general y soporte',
  explicacion: 'Pasos, guía o explicación',
  confianza: 'Dato o estado validado por backend',
  pensando: 'Procesamiento en curso',
  aviso: 'Atención o revisión necesaria',
  alerta_fiscal: 'Riesgo fiscal confirmado',
  empatia: 'Frustración o preocupación del usuario',
  exito: 'Acción operativa completada',
  seguimiento: 'Estado de expediente o proceso',
  duda: 'Falta información o aclaración',
  celebracion: 'Hito excepcional confirmado',
};

function shouldUseThinkingLoop(state: KiaAvatarState) {
  return state === 'pensando';
}

export default function KiaAvatarQaPage() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7355]">QA interno · KIA</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0D1B2A]">Estados y microanimaciones del copiloto</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#665d52]">
            Galería protegida para validar encuadre, expresión y movimiento sin disparar tools ni tocar datos de cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReplayKey((value) => value + 1)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-4 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Repetir animaciones
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-[#e4d9ca] bg-white/80 p-4 text-sm text-[#665d52]">
        <p>
          <strong className="text-[#3d3528]">Qué comprobar:</strong> movimiento discreto, sin saltos de layout y sin efecto teatral.
          En <strong>Éxito</strong>, <strong>Celebración</strong>, <strong>Aviso</strong> y <strong>Alerta fiscal</strong> el movimiento es one-shot;
          <strong> Pensando</strong> mantiene un loop suave. Con “reducir movimiento” del sistema activado, todos deben quedar estáticos.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Estados visuales de KIA">
        {KIA_AVATAR_STATES.map((state) => {
          const thinking = shouldUseThinkingLoop(state);
          const motion = resolveKiaAvatarMotion(state, true);

          return (
            <article key={`${state}-${replayKey}`} className="rounded-2xl border border-[#e4d9ca] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <KiaAvatar
                  state={state}
                  size="lg"
                  decorative={false}
                  animateOnChange={thinking}
                  animateResponse={!thinking}
                />
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#0D1B2A]">{KIA_AVATAR_LABELS[state]}</h2>
                  <p className="mt-0.5 text-xs text-[#8b7355]">{state}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#665d52]">{USAGE[state]}</p>
              <div className="mt-3 flex items-center justify-between border-t border-[#f0e9df] pt-3 text-xs text-[#8b7355]">
                <span>Perfil de movimiento</span>
                <code className="rounded bg-[#f7f2ea] px-2 py-1 text-[#3d3528]">{motion}</code>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
