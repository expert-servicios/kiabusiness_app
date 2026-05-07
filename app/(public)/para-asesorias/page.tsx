import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Workflow
} from 'lucide-react';
import { ParaAsesoriasForm } from './ParaAsesoriasForm';

export const metadata: Metadata = {
  title: 'Sistema digital para asesorías | EXPERT',
  description:
    'Plataforma en desarrollo para asesorías, gestorías y despachos que quieren centralizar clientes, expedientes, documentos, pagos y comunicaciones.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/para-asesorias',
    title: 'Sistema digital para asesorías | EXPERT',
    description:
      'Plataforma en desarrollo para asesorías, gestorías y despachos. Centraliza clientes, expedientes, documentos y pagos.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const operatingModules = [
  { label: 'Clientes', Icon: BriefcaseBusiness },
  { label: 'Expedientes', Icon: Workflow },
  { label: 'Documentos', Icon: FileText },
  { label: 'Pagos', Icon: CreditCard },
  { label: 'Comunicaciones', Icon: MessageSquareText },
  { label: 'IA supervisada', Icon: Bot }
];

const benefits = [
  {
    title: 'Menos trabajo manual',
    text: 'Automatizaciones para presupuestos, documentacion pendiente, avisos de estado, pagos fallidos y seguimiento.'
  },
  {
    title: 'Mas control operativo',
    text: 'Una vista clara de expedientes bloqueados, documentos por revisar y tareas que requieren accion.'
  },
  {
    title: 'Portal seguro para clientes',
    text: 'Documentos, estados, entregables y pagos dentro de un entorno trazable, no perdido entre emails y chats.'
  },
  {
    title: 'Preparado para crecer',
    text: 'Diseño pensado para branding, servicios, plantillas, integraciones y flujos configurables por despacho.'
  }
];

export default function ParaAsesoriasPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Para asesorias</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Sistema digital para asesorias que quieren automatizar su operativa
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF] md:text-lg">
              Estamos desarrollando una plataforma pensada para asesorias, gestorias y despachos profesionales que necesitan centralizar clientes, expedientes, documentos, pagos y comunicaciones en un unico entorno.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
              Diseñada inicialmente para uso interno en EXPERT, la plataforma esta evolucionando hacia una solucion SaaS para profesionales que quieren reducir trabajo manual y operar con mas control.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#b2b-form"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Solicitar informacion
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#b2b-form"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
              >
                Quiero participar en el piloto
                <CheckCircle2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-md border border-[#D4A017]/25 bg-[#23364D]/45 p-5 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Operacion diaria</p>
              <h2 className="mt-2 font-serif text-2xl font-bold">Todo lo que pide accion, en un solo lugar</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {operatingModules.map(({ label, Icon }) => (
                <div key={label} className="rounded-md border border-white/10 bg-[#0D1B2A]/55 p-4">
                  <Icon className="h-5 w-5 text-[#D4A017]" />
                  <p className="mt-3 text-sm font-semibold text-[#F8F6F1]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">Prioridad sugerida</p>
              <p className="mt-1 text-sm leading-6 text-[#DDE7F0]">
                4 expedientes bloqueados por documentacion, 2 presupuestos abiertos y 1 pago fallido pendiente de revisar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Vision SaaS</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Primero probado en una asesoria real. Despues preparado para otros despachos.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              EXPERT se esta construyendo para resolver captacion, workflow, documentacion, comunicacion, pagos e integraciones de una operativa profesional real. Esa misma base es la que queremos validar con asesorias externas.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-md border border-[#D8CBB5] bg-white p-6">
                <ShieldCheck className="h-6 w-6 text-[#D4A017]" />
                <h3 className="mt-5 font-serif text-xl font-bold">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="b2b-form" className="px-6 pb-16 md:pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Pilotos</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Cuentanos como trabaja tu despacho
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              Buscamos entender volumen, herramientas actuales y principal bloqueo operativo. Con eso podremos priorizar pilotos y validar si EXPERT encaja en tu forma de trabajar.
            </p>
            <div className="mt-7 rounded-md border border-[#D4A017]/25 bg-[#D4A017]/10 p-5">
              <p className="text-sm font-semibold text-[#0D1B2A]">No sustituye Holded, email ni WhatsApp.</p>
              <p className="mt-2 text-sm leading-7 text-[#23364D]">
                La idea es conectar esos canales a un flujo trazable: clientes, expedientes, documentos, pagos, comunicaciones y automatizaciones.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-[#D8CBB5] bg-white p-6 shadow-sm md:p-8">
            <ParaAsesoriasForm />
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-14 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Foco actual</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
            EXPERT sigue siendo primero una asesoria digital para clientes finales.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Esta pagina valida la vision SaaS futura sin cambiar la navegacion principal ni distraer la contratacion actual de servicios.
          </p>
          <Link
            href="/servicios"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
          >
            Ver servicios actuales
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
