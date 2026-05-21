'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, MessageCircle } from 'lucide-react';

const WA_NUMBER = '34696550480';

// ── Time-based greeting ───────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 14)  return '¡Buenos días!';
  if (h >= 14 && h < 21) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

// ── Fiscal calendar tips (Spain) ──────────────────────────────────────────────

interface FiscalTip { icon: string; text: string }

function getFiscalTip(): FiscalTip | null {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day   = now.getDate();

  // IRPF campaign: 3 April – 30 June
  if ((month === 4 && day >= 3) || month === 5 || (month === 6 && day <= 30)) {
    return { icon: '📋', text: 'Estamos en campaña de la Renta 2024 (hasta el 30 de junio). ¿Necesitas ayuda con tu declaración?' };
  }
  // Modelo 720: 1 Jan – 31 March
  if (month <= 3) {
    const daysLeft = Math.round((new Date(now.getFullYear(), 2, 31).getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 15) {
      return { icon: '⚠️', text: `Quedan ${daysLeft} días para el Modelo 720 (bienes en el extranjero). ¡No dejes que venza!` };
    }
    return { icon: '🌍', text: 'El Modelo 720 vence el 31 de marzo. ¿Tienes bienes o cuentas en el extranjero?' };
  }
  // Q1 IVA: 1-20 April
  if (month === 4 && day <= 2) {
    return { icon: '📊', text: 'Vencen hoy las declaraciones trimestrales Q1 (IVA, IRPF). ¿Necesitas gestión urgente?' };
  }
  // Q2 IVA: 1-20 July
  if (month === 7 && day <= 20) {
    return { icon: '📊', text: 'Esta semana vencen las declaraciones trimestrales Q2. ¿Eres autónomo? Podemos ayudarte.' };
  }
  // Q3 IVA: 1-20 October
  if (month === 10 && day <= 20) {
    return { icon: '📊', text: 'Esta semana vencen las declaraciones trimestrales Q3. Autónomos, ¡no os perdáis la fecha!' };
  }
  // Q4 / Year-end: November – December
  if (month >= 11) {
    return { icon: '📅', text: 'Fin de año fiscal: buen momento para revisar tu situación tributaria y planificar 2025.' };
  }
  return null;
}

// ── WhatsApp link ─────────────────────────────────────────────────────────────

function getWaUrl(isReturning: boolean, tip: FiscalTip | null): string {
  let msg: string;
  if (isReturning) {
    msg = tip
      ? `Hola Kia, soy cliente de EXPERT. Me interesa: ${tip.text}`
      : 'Hola Kia, soy cliente de EXPERT. ¿Podéis ayudarme?';
  } else {
    msg = 'Hola, me gustaría obtener información sobre vuestros servicios de asesoría.';
  }
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ── Widget ────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'kia_bubble_dismissed';
const VISITED_KEY = 'kia_visited';

export function WhatsAppChatWidget() {
  const [bubbleOpen,  setBubbleOpen]  = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [greeting,    setGreeting]    = useState('¡Hola!');
  const [fiscalTip,   setFiscalTip]   = useState<FiscalTip | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
    setFiscalTip(getFiscalTip());

    const alreadyVisited = !!localStorage.getItem(VISITED_KEY);
    setIsReturning(alreadyVisited);
    localStorage.setItem(VISITED_KEY, '1');

    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }

    // Auto-show on desktop after 5 s
    if (window.innerWidth >= 768) {
      timerRef.current = setTimeout(() => setBubbleOpen(true), 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!bubbleOpen) return;
    function handler(e: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setBubbleOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bubbleOpen]);

  const dismiss = useCallback(() => {
    setBubbleOpen(false);
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  const toggleBubble = useCallback(() => setBubbleOpen((v) => !v), []);

  const waUrl = getWaUrl(isReturning, fiscalTip);

  return (
    <div ref={bubbleRef} className="flex flex-col items-end gap-3">

      {/* ── Popup bubble ── */}
      <div
        className={[
          'w-72 rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-[#D4A017]/20 overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          bubbleOpen && !dismissed
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
        ].join(' ')}
        aria-hidden={!bubbleOpen || dismissed}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#0D1B2A] px-4 py-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/branding/kia_bot.png"
              alt="Kia"
              fill
              className="rounded-full object-cover"
              sizes="40px"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] border-2 border-[#0D1B2A]" aria-label="En línea" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-none">Kia</p>
            <p className="mt-0.5 text-xs text-white/55">Asistente EXPERT · En línea</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-4 pb-3 space-y-2.5">
          {/* Chat bubble */}
          <div className="rounded-2xl rounded-tl-none bg-[#F8F6F1] px-3.5 py-2.5 text-sm text-[#0D1B2A] leading-relaxed">
            <span className="font-semibold">{greeting}</span>{' '}
            {isReturning
              ? 'Bienvenido/a de nuevo a EXPERT 😊 ¿En qué puedo ayudarte hoy?'
              : 'Soy Kia, la asistente virtual de EXPERT. ¿Tienes una consulta sobre fiscalidad, extranjería o empresa?'}
          </div>

          {/* Fiscal tip */}
          {fiscalTip && (
            <div className="rounded-2xl rounded-tl-none bg-[#D4A017]/10 border border-[#D4A017]/25 px-3.5 py-2.5 text-xs text-[#23364D] leading-relaxed">
              <span className="mr-1">{fiscalTip.icon}</span>
              <span className="font-medium">{fiscalTip.text}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe5d] transition-colors"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Iniciar chat con Kia
          </a>
        </div>
      </div>

      {/* ── Floating avatar button ── */}
      {dismissed ? (
        /* After dismissal: direct WhatsApp link */
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chatear con Kia en WhatsApp"
          title="Chatear con Kia en WhatsApp"
          className="group relative h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 overflow-visible"
        >
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[#D4A017]/60 group-hover:ring-[#D4A017]">
            <Image
              src="/branding/kia_bot.png"
              alt="Kia — Asistente EXPERT"
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] border-2 border-white shadow-sm" aria-hidden="true">
            <WhatsAppIcon />
          </span>
        </a>
      ) : (
        /* Default: toggle bubble */
        <button
          type="button"
          onClick={toggleBubble}
          aria-label={bubbleOpen ? 'Cerrar chat' : 'Chatear con Kia en WhatsApp'}
          title="Chatear con Kia en WhatsApp"
          className="group relative h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 overflow-visible"
        >
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[#D4A017]/60 group-hover:ring-[#D4A017] transition-all">
            <Image
              src="/branding/kia_bot.png"
              alt="Kia — Asistente EXPERT"
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          {/* Online dot / WA badge */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] border-2 border-white shadow-sm" aria-hidden="true">
            <WhatsAppIcon />
          </span>
          {/* Pulse ring when bubble is closed */}
          {!bubbleOpen && (
            <span className="absolute inset-0 rounded-full border-2 border-[#25D366]/50 animate-ping" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
