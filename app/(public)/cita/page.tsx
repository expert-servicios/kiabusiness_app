import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Phone, Calendar } from 'lucide-react';
import { getCalMeetingUrl } from '@/lib/utils/cal';

export const metadata: Metadata = {
  title: 'Reservar cita | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Consulta inicial gratuita de 15 minutos con un asesor especializado. Elige tu hueco y recibe confirmación inmediata. Lunes a viernes, 9:00–16:00.',
  openGraph: {
    type     : 'website',
    url      : 'https://expertconsulting.es/cita',
    title    : 'Reservar cita gratuita | EXPERT',
    description: 'Consulta inicial gratuita con asesor especializado en fiscalidad, extranjería y gestión de empresas.',
    siteName : 'EXPERT — Asesoría Fiscal y Legal',
    locale   : 'es_ES',
    images   : [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Reservar cita — EXPERT Asesoría' }],
  },
  twitter  : { card: 'summary_large_image', images: ['/branding/expert%20servicios.png'] },
  alternates: { canonical: 'https://expertconsulting.es/cita' },
};

const CAL_URL = getCalMeetingUrl();

const PILLS = [
  { icon: CheckCircle2, label: 'Gratuita, sin compromiso' },
  { icon: Clock,        label: '15 min · L–V 9:00–16:00' },
  { icon: Phone,        label: 'Teléfono o videollamada' },
];

const HOW_IT_WORKS = [
  'Elige el día y hora que mejor te convenga',
  'Recibes confirmación inmediata por email',
  'Te llamamos nosotros a la hora acordada',
  'Sin coste y sin compromiso',
];

export default function CitaPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0D1B2A] px-6 py-10 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">
            Consulta inicial gratuita
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">
            Reserva tu llamada con un asesor
          </h1>

          {/* Info pills — visible on all screen sizes */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-3 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#D4A017]" />
                <span className="text-xs font-semibold text-[#F8F6F1]/85">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">

          {/* ── Cal.com inline embed ── */}
          {CAL_URL ? (
            <div className="overflow-hidden rounded-xl border border-[#D4A017]/20 bg-white shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
              <iframe
                src={`${CAL_URL}?embed=true&layout=month_view&theme=light`}
                width="100%"
                height="700"
                frameBorder="0"
                title="Reservar cita con EXPERT"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                className="block min-w-[320px]"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-[#D4A017]/20 bg-white p-8 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
              <h2 className="font-serif text-xl font-bold text-[#0D1B2A]">Agenda temporalmente no disponible</h2>
              <p className="mt-3 text-sm leading-6 text-[#374151]">
                Puedes pedir tu cita por email o teléfono y te responderemos con el primer hueco disponible.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/contacto" className="inline-flex items-center justify-center rounded-xl bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A]">
                  Contactar
                </Link>
                <a href="tel:+34696550480" className="inline-flex items-center justify-center rounded-xl border border-[#D4A017]/30 px-5 py-3 text-sm font-bold text-[#0D1B2A]">
                  Llamar
                </a>
              </div>
            </div>
          )}

          {/* ── Desktop sidebar ── */}
          <div className="hidden space-y-4 lg:block">

            <div className="border border-[#D4A017]/20 bg-white p-6 shadow-[0_4px_16px_rgba(13,27,42,0.06)]">
              <h2 className="font-serif text-base font-bold text-[#0D1B2A]">¿Cómo funciona?</h2>
              <ul className="mt-4 space-y-3">
                {HOW_IT_WORKS.map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#D4A017]/20 bg-white p-6">
              <h2 className="font-serif text-base font-bold text-[#0D1B2A]">Horario</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#374151]">
                  <span>Lunes – Viernes</span>
                  <span className="font-semibold text-[#0D1B2A]">9:00 – 16:00</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Sábado – Domingo</span>
                  <span>Cerrado</span>
                </div>
              </div>
            </div>

            <div className="border border-[#D4A017]/30 bg-[#D4A017]/5 p-5">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#374151]">
                  Recibirás un email de confirmación con el enlace de videollamada o el número de teléfono al que te llamaremos.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
