'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const WA_NUMBER = '34696550480';
const SESSION_KEY = 'kia_bubble_dismissed';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 14)  return '¡Buenos días!';
  if (h >= 14 && h < 21) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

interface FiscalChip { icon: string; label: string; waMsg: string }

function getFiscalChip(): FiscalChip | null {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const year  = now.getFullYear();

  // IRPF campaign: 3 Apr – 30 Jun
  if ((month === 4 && day >= 3) || month === 5 || (month === 6 && day <= 30)) {
    return { icon: '📋', label: `Campaña Renta ${year - 1}`, waMsg: `Hola Kia, quiero consultar sobre la Campaña de la Renta ${year - 1}.` };
  }
  // Modelo 720: Jan–Mar
  if (month <= 3) {
    const daysLeft = Math.round((new Date(year, 2, 31).getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 15) {
      return { icon: '⚠️', label: `M720 — ${daysLeft} días`, waMsg: 'Hola Kia, necesito ayuda urgente con el Modelo 720 (bienes en el extranjero).' };
    }
    return { icon: '🌍', label: 'Modelo 720', waMsg: 'Hola Kia, tengo bienes o cuentas en el extranjero y quiero saber si tengo que presentar el M720.' };
  }
  // Quarterly VAT: Q1 1–20 Apr, Q2 1–20 Jul, Q3 1–20 Oct
  if ((month === 4 && day <= 2) || (month === 7 && day <= 20) || (month === 10 && day <= 20)) {
    return { icon: '📊', label: 'Impuestos trimestrales', waMsg: 'Hola Kia, necesito ayuda con las declaraciones trimestrales de IVA e IRPF.' };
  }
  // Q4 / year-end
  if (month >= 11) {
    return { icon: '📅', label: `Planificación fiscal ${year + 1}`, waMsg: `Hola Kia, quiero revisar mi situación fiscal antes de que acabe el año y planificar ${year + 1}.` };
  }
  return null;
}

function buildWaUrl(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ── Quick-reply action types ──────────────────────────────────────────────────

type Action =
  | { kind: 'link'; href: string; label: string; icon: string; external?: true }
  | { kind: 'wa';   msg:  string; label: string; icon: string };

const ANON_BASE: Action[] = [
  { kind: 'link', href: '/servicios',                      label: 'Ver catálogo',    icon: '📋' },
  { kind: 'link', href: 'https://expertconsulting.es/cita', label: 'Solicitar cita',  icon: '📅', external: true },
  { kind: 'wa',   msg: 'Hola Kia, tengo una consulta fiscal.',                        label: 'Consulta fiscal', icon: '💬' },
];

const USER_BASE: Action[] = [
  { kind: 'link', href: '/dashboard/expedientes', label: 'Mis expedientes',    icon: '📁' },
  { kind: 'wa',   msg: 'Hola Kia, soy cliente de EXPERT. Tengo una duda sobre mi expediente.', label: 'Duda sobre mi caso', icon: '💬' },
  { kind: 'link', href: '/servicios',             label: 'Ver catálogo',       icon: '📋' },
];

function buildActions(loggedIn: boolean, chip: FiscalChip | null): Action[] {
  const base = [...(loggedIn ? USER_BASE : ANON_BASE)];
  if (chip) base.push({ kind: 'wa', msg: chip.waMsg, label: chip.label, icon: chip.icon });
  return base;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WhatsAppChatWidget() {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [dismissed,  setDismissed]  = useState(false);
  const [greeting,   setGreeting]   = useState('¡Hola!');
  const [fiscalChip, setFiscalChip] = useState<FiscalChip | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName,   setUserName]   = useState<string | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
    setFiscalChip(getFiscalChip());

    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }

    // Auth detection — session cache, no network round-trip
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setIsLoggedIn(true);
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          const first = data?.full_name?.split(' ')[0];
          if (first) setUserName(first);
        });
    });

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

  const dismiss     = useCallback(() => {
    setBubbleOpen(false);
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);
  const toggleBubble = useCallback(() => setBubbleOpen(v => !v), []);

  const greetingBody = isLoggedIn
    ? userName
      ? `Bienvenido/a, ${userName} 😊 ¿En qué puedo ayudarte hoy?`
      : 'Bienvenido/a de nuevo a EXPERT 😊 ¿En qué puedo ayudarte hoy?'
    : 'Soy Kia, la asistente de EXPERT. ¿Tienes una consulta sobre fiscalidad, extranjería o empresa?';

  const actions = buildActions(isLoggedIn, fiscalChip);

  const fallbackWaUrl = buildWaUrl(
    isLoggedIn
      ? 'Hola Kia, soy cliente de EXPERT. ¿Podéis ayudarme?'
      : 'Hola, me gustaría obtener información sobre los servicios de EXPERT.',
  );

  return (
    <div ref={bubbleRef} className="flex flex-col items-end gap-3">

      {/* ── Popup bubble ─────────────────────────────────────────────────── */}
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
            <Image src="/branding/kia_bot.png" alt="Kia" fill className="rounded-full object-cover" sizes="40px" />
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
        <div className="px-4 pt-4 pb-2 space-y-3">
          {/* Greeting bubble */}
          <div className="rounded-2xl rounded-tl-none bg-[#F8F6F1] px-3.5 py-2.5 text-sm text-[#0D1B2A] leading-relaxed">
            <span className="font-semibold">{greeting}</span>{' '}{greetingBody}
          </div>

          {/* Quick-reply chips */}
          <div className="flex flex-col gap-1.5">
            {actions.map(action =>
              action.kind === 'link' ? (
                <Link
                  key={action.label}
                  href={action.href}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  onClick={dismiss}
                  className="flex items-center gap-2.5 rounded-xl border border-[#D4A017]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#0D1B2A] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                >
                  <span aria-hidden="true">{action.icon}</span>
                  {action.label}
                </Link>
              ) : (
                <a
                  key={action.label}
                  href={buildWaUrl(action.msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="flex items-center gap-2.5 rounded-xl border border-[#D4A017]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#0D1B2A] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                >
                  <span aria-hidden="true">{action.icon}</span>
                  {action.label}
                </a>
              )
            )}
          </div>
        </div>

        {/* Footer — direct WhatsApp fallback */}
        <div className="px-4 pb-4 pt-2">
          <a
            href={fallbackWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe5d] transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chatear con Kia
          </a>
        </div>
      </div>

      {/* ── Floating avatar button ────────────────────────────────────────── */}
      {(!bubbleOpen || dismissed) && (
        dismissed ? (
          <a
            href={fallbackWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chatear con Kia en WhatsApp"
            title="Chatear con Kia en WhatsApp"
            className="group relative h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 overflow-visible"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[#D4A017]/60 group-hover:ring-[#D4A017]">
              <Image src="/branding/kia_bot.png" alt="Kia — Asistente EXPERT" fill className="object-cover" sizes="56px" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] border-2 border-white shadow-sm" aria-hidden="true">
              <WhatsAppIcon className="h-3 w-3" />
            </span>
          </a>
        ) : (
          <button
            type="button"
            onClick={toggleBubble}
            aria-label="Chatear con Kia en WhatsApp"
            title="Chatear con Kia en WhatsApp"
            className="group relative h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 overflow-visible"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[#D4A017]/60 group-hover:ring-[#D4A017] transition-all">
              <Image src="/branding/kia_bot.png" alt="Kia — Asistente EXPERT" fill className="object-cover" sizes="56px" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] border-2 border-white shadow-sm" aria-hidden="true">
              <WhatsAppIcon className="h-3 w-3" />
            </span>
            <span className="absolute inset-0 rounded-full border-2 border-[#25D366]/50 animate-ping" aria-hidden="true" />
          </button>
        )
      )}
    </div>
  );
}

function WhatsAppIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-white`} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
