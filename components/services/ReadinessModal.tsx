'use client';

import { useState, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft,
  CheckCircle2, ShoppingCart, Calendar,
  FileText, PlayCircle, BookOpen, MessageSquare,
} from 'lucide-react';
import type {
  ReadinessCheck,
  ReadinessQuestion,
  ReadinessAnswers,
  ReadinessNextAction,
  ReadinessResult,
} from '@/lib/data/service-readiness-checks';
import { calculateReadinessResult } from '@/lib/data/service-readiness-checks';

// ── Env-var URLs with safe fallbacks ─────────────────────────────────────────
const HOLDED_TRIAL_URL   = process.env.NEXT_PUBLIC_HOLDED_TRIAL_URL   ?? 'https://www.holded.com/es';
const HOLDED_API_URL     = process.env.NEXT_PUBLIC_HOLDED_API_DOCS_URL ?? 'https://developers.holded.com';
const HOLDED_ACADEMY_URL = process.env.NEXT_PUBLIC_HOLDED_ACADEMY_URL  ?? 'https://www.holded.com/es/academia';

// ── CTA config per next-action ────────────────────────────────────────────────
interface CtaConfig {
  primary  : { label: string; icon: React.ElementType; href?: string; action?: 'checkout' | 'close' };
  secondary?: { label: string; href: string };
}

function getCtaConfig(nextAction: ReadinessNextAction, serviceSlug: string): CtaConfig {
  void serviceSlug;
  switch (nextAction) {
    case 'continue_checkout':
      return {
        primary: { label: 'Continuar con la contratación', icon: ShoppingCart, action: 'checkout' },
      };
    case 'holded_trial':
      return {
        primary  : { label: 'Activar prueba gratuita de Holded', icon: PlayCircle, href: HOLDED_TRIAL_URL },
        secondary: { label: 'Ver Pack Starter', href: '/holded/pack-starter' },
      };
    case 'recommend_plan_avanzado':
      return {
        primary  : { label: 'Ver Plan Avanzado', icon: FileText, href: '/planes/avanzado' },
        secondary: { label: 'Preguntar a Kia', href: '/ayuda/kia?topic=planes-mensuales' },
      };
    case 'api_tutorial':
      return {
        primary  : { label: 'Ver documentación API de Holded', icon: BookOpen, href: HOLDED_API_URL },
        secondary: { label: 'Reservar llamada técnica', href: '/cita' },
      };
    case 'upload_excel':
      return {
        primary  : { label: 'Reservar llamada para preparar datos', icon: Calendar, href: '/cita' },
        secondary: { label: 'Ver plantilla de migración', href: HOLDED_ACADEMY_URL },
      };
    case 'book_call':
      return {
        primary  : { label: 'Reservar llamada gratuita (15 min)', icon: Calendar, href: '/cita' },
        secondary: { label: 'Enviar consulta por escrito', href: '/contacto' },
      };
    case 'request_quote':
      return {
        primary  : { label: 'Solicitar presupuesto personalizado', icon: FileText, href: '/solicitar-presupuesto' },
        secondary: { label: 'Reservar llamada informativa', href: '/cita' },
      };
    case 'manual_review':
      return {
        primary  : { label: 'Contactar con el equipo', icon: MessageSquare, href: '/contacto' },
        secondary: { label: 'Reservar llamada de asesoramiento', href: '/cita' },
      };
    default:
      return {
        primary: { label: 'Continuar con la contratación', icon: ShoppingCart, action: 'checkout' },
      };
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-[#D4A017] transition-all duration-300"
        style={{ width: `${Math.round((step / total) * 100)}%` }}
      />
    </div>
  );
}

// ── Question step ─────────────────────────────────────────────────────────────
function QuestionStep({
  question,
  answer,
  onChange,
}: {
  question : ReadinessQuestion;
  answer   : string | undefined;
  onChange : (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-white leading-snug">{question.text}</p>
        {question.hint && (
          <p className="mt-1 text-xs text-white/45">{question.hint}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {question.options.map(opt => {
          const selected = answer === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                  : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-xs text-white/45">{opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Result step ───────────────────────────────────────────────────────────────
function ResultStep({
  result,
  serviceSlug,
  onApproved,
  onClose,
}: {
  result      : ReadinessResult;
  serviceSlug : string;
  onApproved ?: () => void;
  onClose     : () => void;
}) {
  const cta = getCtaConfig(result.nextAction, serviceSlug);

  const handlePrimary = () => {
    if (cta.primary.action === 'checkout') {
      onApproved?.();
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Outcome banner */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${
        result.canCheckout
          ? 'border-emerald-700/40 bg-emerald-950/30'
          : 'border-[#D4A017]/30 bg-[#D4A017]/5'
      }`}>
        <CheckCircle2 className={`mt-0.5 h-6 w-6 shrink-0 ${
          result.canCheckout ? 'text-emerald-400' : 'text-[#D4A017]'
        }`} />
        <div>
          <p className={`text-sm font-bold ${
            result.canCheckout ? 'text-emerald-300' : 'text-[#D4A017]'
          }`}>
            {result.title}
          </p>
          <p className="mt-1 text-sm text-white/70 leading-relaxed">
            {result.message}
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        {cta.primary.action ? (
          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 hover:bg-[#F2C14E] transition"
          >
            <cta.primary.icon className="h-4 w-4" />
            {cta.primary.label}
          </button>
        ) : (
          <a
            href={cta.primary.href}
            target={cta.primary.href?.startsWith('http') ? '_blank' : undefined}
            rel={cta.primary.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 hover:bg-[#F2C14E] transition"
          >
            <cta.primary.icon className="h-4 w-4" />
            {cta.primary.label}
          </a>
        )}

        {cta.secondary && (
          <a
            href={cta.secondary.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            {cta.secondary.label}
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/35 hover:text-white/60 transition text-center"
        >
          Cerrar
        </button>
      </div>

      <p className="text-[10px] text-white/25 text-center leading-relaxed">
        Esta evaluación es orientativa. Tus datos se tratan conforme al RGPD.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReadinessModalProps {
  check       : ReadinessCheck;
  serviceSlug : string;
  onApproved ?: () => void;
  onClose     : () => void;
}

export function ReadinessModal({ check, serviceSlug, onApproved, onClose }: ReadinessModalProps) {
  const [phase, setPhase] = useState<'intro' | 'questions' | 'result'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<ReadinessAnswers>({});
  const [result, setResult] = useState<ReadinessResult | null>(null);

  const totalSteps = 1 + check.questions.length + 1; // intro + questions + result
  const currentStepNum =
    phase === 'intro'     ? 1 :
    phase === 'questions' ? 2 + qIndex :
    totalSteps;

  const currentQ: ReadinessQuestion | undefined = check.questions[qIndex];
  const currentAnswer = currentQ ? (answers[currentQ.id] as string | undefined) : undefined;

  const handleNext = useCallback(() => {
    if (phase === 'intro') {
      setPhase('questions');
      setQIndex(0);
      return;
    }
    if (phase === 'questions') {
      if (qIndex < check.questions.length - 1) {
        setQIndex(i => i + 1);
      } else {
        const res = calculateReadinessResult(check, answers);
        setResult(res);
        setPhase('result');
      }
    }
  }, [phase, qIndex, check, answers]);

  const handleBack = useCallback(() => {
    if (phase === 'questions' && qIndex > 0) { setQIndex(i => i - 1); return; }
    if (phase === 'questions' && qIndex === 0) { setPhase('intro'); return; }
  }, [phase, qIndex]);

  const canAdvance =
    phase === 'intro'     ? true :
    phase === 'questions' ? Boolean(currentAnswer) :
    false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D1B2A] px-6 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#D4A017]">
                Comprobación de preparación
              </p>
              <h2 className="mt-0.5 text-base font-bold text-white leading-snug">
                {check.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="mt-0.5 shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {phase !== 'result' && (
            <div className="mt-3">
              <ProgressBar step={currentStepNum} total={totalSteps} />
              <p className="mt-1 text-[10px] text-white/30">
                Paso {currentStepNum} de {totalSteps} · ~{check.questions.length + 1} min
              </p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Intro ── */}
          {phase === 'intro' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-white/70 leading-relaxed">{check.description}</p>
              <p className="text-sm text-white/50">
                Responde {check.questions.length} pregunta{check.questions.length !== 1 ? 's' : ''} breve{check.questions.length !== 1 ? 's' : ''} y te diremos exactamente qué pasos dar.
              </p>
            </div>
          )}

          {/* ── Questions ── */}
          {phase === 'questions' && currentQ && (
            <QuestionStep
              question={currentQ}
              answer={currentAnswer}
              onChange={id => setAnswers(a => ({ ...a, [currentQ.id]: id }))}
            />
          )}

          {/* ── Result ── */}
          {phase === 'result' && result && (
            <ResultStep
              result={result}
              serviceSlug={serviceSlug}
              onApproved={onApproved}
              onClose={onClose}
            />
          )}

        </div>

        {/* Footer navigation */}
        {phase !== 'result' && (
          <div className="sticky bottom-0 bg-[#0D1B2A] border-t border-white/10 px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={phase === 'intro'}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 disabled:invisible transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance}
              className="flex items-center gap-2 rounded-xl bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 hover:bg-[#F2C14E] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {phase === 'questions' && qIndex === check.questions.length - 1
                ? 'Ver resultado'
                : 'Siguiente'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
