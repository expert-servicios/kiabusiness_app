import type { Metadata } from 'next';
import { Calendar, CheckCircle2, Clock, Phone, Video } from 'lucide-react';
import { CitaForm } from './CitaForm';

export const metadata: Metadata = {
  title: 'Reservar cita | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Solicita una consulta inicial gratuita con nuestros asesores. Resolvemos tus dudas fiscales, de extranjería, empresa o gestión administrativa en una reunión personalizada.',
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

const BENEFITS = [
  { icon: CheckCircle2, text: 'Consulta inicial completamente gratuita' },
  { icon: Clock, text: 'Confirmación en menos de 24 horas hábiles' },
  { icon: Phone, text: 'Reunión por teléfono o videollamada — sin desplazamientos' },
  { icon: Calendar, text: 'Disponibilidad de lunes a viernes, mañana y tarde' }
];

export default function CitaPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Consulta inicial gratuita</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
            Reserva una cita con tu asesor
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Cuéntanos tu caso y te ayudamos a encontrar la solución más adecuada. Sin compromiso, sin letra pequeña. La primera consulta siempre es gratuita. La reunión se realiza por teléfono o videollamada.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">

          {/* ── Form ── */}
          <div className="order-2 lg:order-1">
            <div className="border border-[#D4A017]/20 bg-white p-8 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
              <h2 className="font-serif text-xl font-bold text-[#0D1B2A]">Solicitar cita</h2>
              <p className="mt-1 text-sm text-[#4B5563]">Rellena el formulario y te confirmamos en menos de 24h.</p>
              <div className="mt-6">
                <CitaForm />
              </div>
            </div>
          </div>

          {/* ── Info sidebar ── */}
          <div className="order-1 space-y-6 lg:order-2">

            {/* Beneficios */}
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
                  <span className="font-semibold">9:00 – 13:30 · 15:00 – 19:00</span>
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
