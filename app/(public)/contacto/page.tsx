import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contacto | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Contacta con EXPERT. Respuesta en menos de 24 horas hábiles. Email, WhatsApp y formulario de contacto.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/contacto',
    title: 'Contacto | EXPERT — Asesoría Fiscal y Legal',
    description: 'Contacta con EXPERT. Respuesta en menos de 24 horas hábiles.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const contactItems = [
  {
    Icon: MessageCircle,
    label: 'WhatsApp',
    value: '+34 696 55 04 80',
    href: 'https://wa.me/34696550480',
    note: 'Respuesta rápida en horario laboral'
  },
  {
    Icon: Mail,
    label: 'Email',
    value: 'soy@expertconsulting.es',
    href: 'mailto:soy@expertconsulting.es',
    note: 'Respondemos en menos de 24 h hábiles'
  },
  {
    Icon: MapPin,
    label: 'Ubicación',
    value: 'España',
    href: null,
    note: 'Servicio 100 % online desde cualquier lugar'
  },
  {
    Icon: Clock,
    label: 'Horario',
    value: 'Lun – Vie: 9:00 – 18:00',
    href: null,
    note: 'Hora peninsular española (CET/CEST)'
  }
];

export default function ContactoPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Contacto</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Cuéntanos tu caso</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#9CA3AF]">
            Escríbenos por el canal que prefieras. Analizamos tu situación sin compromiso y te respondemos con claridad.
          </p>
        </div>
      </div>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">

          {/* Form */}
          <div>
            <h2 className="font-serif text-2xl font-bold">Formulario de contacto</h2>
            <p className="mt-2 text-sm text-[#23364D]">
              Rellena el formulario y te respondemos en menos de 24 horas hábiles.
            </p>
            <ContactForm />
          </div>

          {/* Contact info sidebar */}
          <div className="space-y-5">
            <div className="bg-[#0D1B2A] p-6 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Datos de contacto</p>
              <ul className="mt-5 space-y-5">
                {contactItems.map(({ Icon, label, value, href, note }) => (
                  <li key={label} className="flex items-start gap-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="mt-0.5 block text-sm font-semibold text-[#F8F6F1] transition hover:text-[#D4A017]"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-semibold text-[#F8F6F1]">{value}</p>
                      )}
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">{note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="https://wa.me/34696550480"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center gap-2.5 bg-[#25D366] px-6 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribir por WhatsApp
            </a>

            <a
              href="https://calendly.com/soy-kseniailicheva/reunion-informativa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col border border-[#D4A017] bg-white p-5 transition hover:bg-[#D4A017]/5"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Gratis · 15 minutos</p>
              <p className="mt-1 font-serif text-base font-bold text-[#0D1B2A]">Llamada informativa</p>
              <p className="mt-1 text-sm leading-6 text-[#23364D]">
                Cuéntanos tu caso en una llamada sin compromiso y te decimos exactamente cómo podemos ayudarte.
              </p>
              <span className="mt-3 text-sm font-bold text-[#D4A017]">
                Reservar llamada →
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
