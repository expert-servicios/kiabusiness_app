import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { PlanCtaButton } from '@/components/planes/PlanCtaButton';
import { PlanComparison } from '@/components/planes/PlanComparison';

export const metadata: Metadata = {
  title: 'Plan Supervisión — 49 €/mes + IVA | EXPERT',
  description:
    'Plan Supervisión para autónomos y pequeñas empresas que llevan Holded y quieren revisión mensual, alertas Kia y soporte básico. No incluye presentación de impuestos.',
  alternates: { canonical: 'https://expertconsulting.es/planes/supervision' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/supervision',
    title: 'Plan Supervisión — 49 €/mes + IVA | EXPERT',
    description: 'Revisión mensual básica de Holded, alertas Kia y soporte básico sin delegar la gestión completa.',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Plan Supervisión — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/consultoria.png'] }
};

const includes = [
  'Revisión mensual básica de Holded',
  'Alertas de errores y anomalías',
  'Revisión de facturas y categorías principales',
  'Revisión básica de bancos/conciliación',
  'Resumen mensual generado por Kia',
  'Estado de empresa básico',
  'Soporte por email/WhatsApp',
  'Portal Cliente EXPERT',
  'Licencia Holded obligatoria no incluida',
];

const notIncludes = [
  'Presentación de impuestos',
  'Contabilidad delegada',
  'Subida de facturas por EXPERT',
  'Migración de datos',
  'Nóminas/laboral',
  'Reuniones periódicas',
  'Revisión fiscal avanzada',
];

export default function PlanSupervisionPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-4xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Planes', href: '/planes' }, { label: 'Plan Supervisión' }]} />
      </div>

      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
          <ShieldCheck className="mx-auto mt-5 h-10 w-10 text-[#D4A017]" />
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Plan Supervisión</h1>
          <div className="mt-5 flex items-end justify-center gap-1">
            <span className="font-serif text-5xl font-bold text-[#D4A017]">49</span>
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes + IVA</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Tú llevas Holded. Kia y EXPERT supervisan lo esencial, detectan alertas y te ayudan a no perder el control mensual.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="w-full max-w-xs">
              <PlanCtaButton planSlug="supervision" ctaLabel="Configurar plan — 49 €/mes" />
            </div>
            <Link
              href="/ayuda/kia?topic=plan-supervision"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Tengo dudas, consultar
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-bold">Qué incluye</h2>
            <ul className="mt-5 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                  <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">Qué no incluye</h2>
            <ul className="mt-5 space-y-3">
              {notIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" />
                  <span className="text-sm leading-6 text-[#6B7280]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[#23364D]">
              Si necesitas impuestos trimestrales, revisa el{' '}
              <Link href="/planes/avanzado" className="font-semibold text-[#D4A017] hover:underline">
                Plan Avanzado
              </Link>.
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-[#D4A017]/25 pt-10">
          <h2 className="font-serif text-2xl font-bold">Cómo funciona</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { n: '01', title: 'Te registras', text: 'Creas tu cuenta en el portal EXPERT y seleccionas el Plan Supervisión.' },
              { n: '02', title: 'Conectas Holded', text: 'Nos das acceso a tu cuenta de Holded para la supervisión mensual.' },
              { n: '03', title: 'Supervisamos contigo', text: 'Kia y tu asesora revisan cada mes, detectan errores y te avisan de lo que requiere tu atención — la gestión y la presentación de impuestos siguen siendo tuyas.' }
            ].map(({ n, title, text }) => (
              <div key={n} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.07)]">
                <span className="font-serif text-3xl font-bold text-[#D4A017]">{n}</span>
                <h3 className="mt-4 font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan comparison */}
      <PlanComparison current="supervision" />

      {/* CTA */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">¿Listo para empezar?</h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Sin permanencia. Cancela cuando quieras con 30 días de preaviso.
          </p>
          <Link
            href="/planes#planes"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Configurar desde planes
          </Link>
        </div>
      </section>
    </main>
  );
}
