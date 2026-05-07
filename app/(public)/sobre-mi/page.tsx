import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, Briefcase, CheckCircle, GraduationCap, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre mí — Ksenia Ilicheva | EXPERT',
  description:
    'Ksenia Ilicheva, asesora fiscal, legal y administrativa en España. Más de 20 años de experiencia, colaboradora social de la AEAT, Red PAE y Holded Solution Partner.',
  openGraph: {
    type: 'profile',
    url: 'https://kseniailicheva.com/sobre-mi',
    title: 'Ksenia Ilicheva — Asesora Fiscal y Legal | EXPERT',
    description:
      'Más de 20 años de experiencia en asesoría fiscal, legal y administrativa en España. Colaboradora social AEAT, Holded Solution Partner.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const credentials = [
  { Icon: Shield, label: 'Colaboradora social AEAT', text: 'Autorizada para presentar declaraciones ante la Agencia Tributaria en nombre de clientes.' },
  { Icon: Briefcase, label: 'Holded Solution Partner', text: 'Partners certificados de Holded para implementación, migración y formación en el ERP.' },
  { Icon: Award, label: 'Camerfirma — Punto de Registro', text: 'Autorizada para emitir certificados digitales cualificados para personas y empresas.' },
  { Icon: GraduationCap, label: 'Red PAE', text: 'Punto de Atención al Emprendedor integrado en la red oficial de apoyo a nuevos negocios.' }
];

const values = [
  { title: 'Claridad ante todo', text: 'Los trámites son complejos; la comunicación no tiene por qué serlo. Explico cada paso con claridad y en el idioma que necesites.' },
  { title: 'Gestión 100 % digital', text: 'Sin desplazamientos innecesarios. Todo el proceso se gestiona de forma online desde cualquier lugar.' },
  { title: 'Criterio profesional', text: 'No solo presento documentos: analizo tu situación, identifico riesgos y propongo la mejor estrategia para tu caso.' },
  { title: 'Respuesta rápida', text: 'Los plazos de Hacienda no esperan. Me comprometo a responder y actuar a tiempo, siempre.' }
];

export default function SobreMiPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="relative mx-auto h-56 w-56 shrink-0 overflow-hidden rounded-full border-4 border-[#D4A017]/40 shadow-2xl lg:h-64 lg:w-64">
            <Image
              src="/avatars/ksenia-perfil.png"
              alt="Ksenia Ilicheva"
              fill
              sizes="256px"
              className="object-cover object-top"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Asesora fiscal y administrativa</p>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">Ksenia Ilicheva</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
              Llevo más de 20 años ayudando a personas, familias y empresas a resolver sus obligaciones fiscales,
              legales y administrativas en España. Trabajo con rigor, claridad y compromiso real con cada caso.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/solicitar-presupuesto"
                className="inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Trabajemos juntos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://www.linkedin.com/in/ksenia-ilicheva/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 border border-[#D4A017]/50 px-6 py-2.5 text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="px-6 py-14 md:py-18">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <h2 className="font-serif text-2xl font-bold md:text-3xl">Mi historia</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[#23364D] md:text-base">
              <p>
                Empecé mi carrera en el ámbito fiscal y administrativo hace más de dos décadas, cuando los trámites con
                la Administración eran todavía mayoritariamente presenciales y la digitalización apenas empezaba. Esa
                experiencia me dio una base sólida en la normativa española y un conocimiento profundo de los procesos
                reales que hay detrás de cada declaración, permiso o escritura.
              </p>
              <p>
                Con el tiempo, especialicé mi práctica en los colectivos que más lo necesitan: expatriados que llegan a
                España sin saber por dónde empezar, empresas internacionales que necesitan cumplimiento fiscal local, y
                autónomos que quieren crecer sin ahogarse en burocracia. Esa combinación de perfiles me ha dado una
                visión muy completa de los retos fiscales y legales en España.
              </p>
              <p>
                Hoy, a través de EXPERT, ofrezco un servicio completamente digital que permite gestionar cualquier
                trámite desde cualquier lugar. Sin desplazamientos, sin papeleo innecesario, con seguimiento claro y
                comunicación directa.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="font-serif text-xl font-bold">¿Por qué elegir EXPERT?</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {values.map(({ title, text }) => (
                  <div key={title} className="flex items-start gap-3 border border-[#D4A017]/20 bg-white p-4 shadow-sm">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                    <div>
                      <p className="font-semibold text-[#0D1B2A]">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#23364D]">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar credentials */}
          <div className="space-y-5">
            <div className="bg-[#0D1B2A] p-6 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Acreditaciones</p>
              <ul className="mt-5 space-y-5">
                {credentials.map(({ Icon, label, text }) => (
                  <li key={label} className="flex items-start gap-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                    <div>
                      <p className="text-sm font-bold text-[#F8F6F1]">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#9CA3AF]">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#D4A017]/25 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Idiomas de trabajo</p>
              <ul className="mt-4 space-y-2 text-sm text-[#23364D]">
                <li className="flex items-center gap-2"><span className="text-[#D4A017]">●</span> Español (nativo)</li>
                <li className="flex items-center gap-2"><span className="text-[#D4A017]">●</span> Ruso (nativo)</li>
                <li className="flex items-center gap-2"><span className="text-[#D4A017]">●</span> Inglés (profesional)</li>
              </ul>
            </div>

            <div className="border border-[#D4A017]/25 bg-white p-6 text-center">
              <p className="font-serif text-4xl font-bold text-[#D4A017]">+20</p>
              <p className="mt-1 text-sm font-semibold text-[#0D1B2A]">años de experiencia</p>
              <p className="mt-4 font-serif text-4xl font-bold text-[#D4A017]">500+</p>
              <p className="mt-1 text-sm font-semibold text-[#0D1B2A]">clientes gestionados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0D1B2A] px-6 py-14 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Hablemos</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">¿Tienes una consulta?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#9CA3AF]">
            Cuéntame tu caso sin compromiso. Analizo tu situación y te propongo la mejor solución.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Solicitar presupuesto
            </Link>
            <Link
              href="/contacto"
              className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/50 px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Escribirme
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
