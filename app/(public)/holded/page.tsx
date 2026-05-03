import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FileText, MonitorCheck, Settings, Upload } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Holded Solution Partner | EXPERT',
  description:
    'Migración de contabilidad a Holded, configuración inicial, formación y acompañamiento para empresas y autónomos.'
};

const migrationSteps = [
  {
    title: 'Diagnóstico',
    text: 'Revisamos tu sistema actual, facturación, bancos, impuestos y necesidades de reporting.',
    Icon: FileText
  },
  {
    title: 'Migración',
    text: 'Definimos qué datos se trasladan, qué se depura y cómo se ordena la operativa en Holded.',
    Icon: Upload
  },
  {
    title: 'Configuración',
    text: 'Ajustamos facturas, contactos, bancos, categorías, impuestos y circuitos de trabajo.',
    Icon: Settings
  },
  {
    title: 'Formación',
    text: 'Sesiones prácticas para que el equipo trabaje con seguridad desde el primer día.',
    Icon: MonitorCheck
  }
] as const;

const services = [
  'Migración desde hojas de cálculo o software anterior',
  'Configuración inicial de empresa, facturación y bancos',
  'Revisión de procesos contables y administrativos',
  'Formación en Holded en bloques de 2 horas por 180 euros',
  'Acompañamiento inicial tras la migración'
] as const;

export default function HoldedPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Holded Solution Partner</p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Migración contable a Holded con una estructura clara.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF] md:text-lg">
              Te ayudamos a pasar de procesos dispersos a una gestión contable y administrativa más ordenada,
              conectada y preparada para crecer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/solicitar-presupuesto?servicio=demo-holded"
                className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Solicitar demostración
              </Link>
              <Link
                href="/servicios/formacion"
                className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
              >
                Formación en Holded
              </Link>
            </div>
          </div>

          <div className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Qué incluye</p>
            <div className="mt-5 space-y-3">
              {services.map((service) => (
                <div key={service} className="flex gap-3 border border-[#D4A017]/20 bg-[#0D1B2A]/45 p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                  <p className="text-sm leading-6 text-[#F8F6F1]/86">{service}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Proceso</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Una migración pensada para no desordenar tu actividad.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              Primero ordenamos el punto de partida, después migramos y configuramos, y finalmente formamos al equipo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {migrationSteps.map(({ Icon, title, text }) => (
              <article key={title} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)]">
                <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
                <h3 className="mt-6 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-16 text-center text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Siguiente paso</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Revisamos tu caso y preparamos una hoja de ruta.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9CA3AF]">
            Si ya usas Holded o quieres migrar, empezamos con una revisión inicial para definir alcance, prioridades y formación.
          </p>
          <Link
            href="/solicitar-presupuesto?servicio=demo-holded"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Solicitar demostración
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
