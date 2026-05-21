import type { Metadata } from 'next';
import { CheckCircle2, Clock, Phone, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reservar cita | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Solicita una consulta inicial gratuita con nuestros asesores. Resolvemos tus dudas fiscales, de extranjería, empresa o gestión administrativa en una reunión por teléfono o videollamada.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/cita',
    title: 'Reservar cita gratuita | EXPERT',
    description: 'Consulta inicial gratuita con asesor especializado en fiscalidad, extranjería y gestión de empresas.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Reservar cita — EXPERT Asesoría' }]
  },
  twitter: { card: 'summary_large_image', images: ['/branding/expert%20servicios.png'] },
  alternates: { canonical: 'https://expertconsulting.es/cita' }
};

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_REUNION_URL ??
  'https://calendly.com/soy-kseniailicheva/reunion-informativa';

const BENEFITS = [
  { icon: CheckCircle2, text: 'Consulta inicial completamente gratuita' },
  { icon: Clock,        text: 'Confirmación inmediata al elegir tu hueco' },
  { icon: Phone,        text: 'Llamada telefónica o videollamada — sin desplazamientos' },
  { icon: Calendar,     text: 'Disponibilidad de lunes a viernes, mañana y tarde' },
];

export default function CitaPage() {
  const embedUrl = `${CALENDLY_URL}${CALENDLY_URL.includes('?') ? '&' : '?'}background_color=f8f6f1&text_color=061321&primary_color=d4a017`;

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Consulta inicial gratuita</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
            Reserva una llamada con tu asesor
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Elige el hueco que mejor te venga. La primera consulta siempre es gratuita — 15 minutos por teléfono o videollamada, sin compromiso ni letra pequeña.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">

          {/* ── Calendly embed ── */}
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden border border-[#D4A017]/20 bg-white shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
              <iframe
                src={embedUrl}
                width="100%"
                height="700"
                frameBorder="0"
                title="Reservar llamada gratuita 15 min — EXPERT Asesoría"
                loading="lazy"
              />
            </div>
          </div>

          {/* ── Info sidebar ── */}
          <div className="order-1 space-y-6 lg:order-2">

            <div className="border border-[#D4A017]/20 bg-white p-6 shadow-[0_4px_16px_rgba(13,27,42,0.06)]">
              <h3 className="font-serif text-lg font-bold text-[#0D1B2A]">¿Cómo funciona?</h3>
              <ul className="mt-4 space-y-3">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-[#374151]">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Horario */}
            <div className="border border-[#D4A017]/20 bg-white p-6">
              <h3 className="font-serif text-base font-bold text-[#0D1B2A]">Horario de atención</h3>
              <div className="mt-3 space-y-1.5 text-sm text-[#374151]">
                <div className="flex justify-between">
                  <span>Lunes – Viernes</span>
                  <span className="font-semibold">9:00 – 19:00</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Sábado – Domingo</span>
                  <span>Cerrado</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
