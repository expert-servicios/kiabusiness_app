import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Mail, MapPin, MessageCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Contacta con EXPERT. Respuesta en menos de 24 horas hábiles. Email, WhatsApp y formulario de contacto.'
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
    value: 'soy@kseniailicheva.com',
    href: 'mailto:soy@kseniailicheva.com',
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
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
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

            <form
              action="/api/contact"
              method="POST"
              className="mt-6 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-semibold text-[#0D1B2A]">Nombre *</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Tu nombre"
                    className="mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#0D1B2A]">Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-semibold text-[#0D1B2A]">Teléfono / WhatsApp</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+34 600 000 000"
                  className="mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10"
                />
              </div>

              <div>
                <label htmlFor="asunto" className="block text-sm font-semibold text-[#0D1B2A]">¿Sobre qué necesitas ayuda?</label>
                <select
                  id="asunto"
                  name="asunto"
                  className="mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10"
                >
                  <option value="">— Selecciona un área —</option>
                  <option>Declaraciones e impuestos (IRPF, IVA, IS...)</option>
                  <option>Extranjería y nacionalidad</option>
                  <option>Empresas y autónomos</option>
                  <option>Tráfico y capitanía marítima</option>
                  <option>Notaría y propiedades</option>
                  <option>Gestiones especializadas</option>
                  <option>Formación</option>
                  <option>Planes de suscripción</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="mensaje" className="block text-sm font-semibold text-[#0D1B2A]">Mensaje *</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={5}
                  required
                  placeholder="Cuéntanos brevemente tu situación o consulta..."
                  className="mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10"
                />
              </div>

              {/* Honeypot — hidden from users, traps bots */}
              <input
                name="hp_url"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px overflow-hidden"
              />

              {turnstileSiteKey && (
                <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
              )}

              <p className="text-xs text-[#9CA3AF]">
                Al enviar este formulario aceptas nuestra{' '}
                <Link href="/privacidad" className="text-[#D4A017] hover:text-[#F2C14E]">Política de privacidad</Link>.
              </p>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center bg-[#0D1B2A] px-6 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#23364D] sm:w-auto sm:px-10"
              >
                Enviar mensaje
              </button>
            </form>
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

            <div className="border border-[#D4A017]/25 bg-white p-5 text-sm text-[#23364D]">
              <p className="font-semibold text-[#0D1B2A]">¿Prefieres una reunión?</p>
              <p className="mt-1 leading-6">
                Podemos hacer una videollamada de 20 minutos sin coste para entender tu caso y ver cómo podemos ayudarte.
              </p>
              <Link
                href="/solicitar-presupuesto"
                className="mt-3 inline-block text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Solicitar videollamada →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
