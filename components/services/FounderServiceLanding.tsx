import Link from 'next/link';
import { CheckCircle2, ExternalLink, FileText, MessageCircle, ShieldCheck } from 'lucide-react';
import { FounderServiceCheckoutButton } from '@/components/services/FounderServiceCheckoutButton';
import type { FounderServiceSlug } from '@/lib/services/founder-services';

type ExternalResource = { label: string; href: string; note: string };

type Props = {
  slug: FounderServiceSlug;
  eyebrow: string;
  title: string;
  intro: string;
  price: string;
  priceNote?: string;
  checkoutLabel: string;
  includes: string[];
  steps: { title: string; text: string }[];
  resources: ExternalResource[];
  notes: string[];
  faqs: { q: string; a: string }[];
  related?: { title: string; text: string; href: string; cta: string };
};

export function FounderServiceLanding(props: Props) {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-6xl">
          <Link href="/servicios/empresas-autonomos" className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">
            ← Empresas y Autónomos
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">{props.eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-5xl">{props.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{props.intro}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Precio</p>
              <p className="mt-2 font-serif text-3xl font-bold">{props.price}</p>
              {props.priceNote && <p className="mt-2 text-sm leading-6 text-white/55">{props.priceNote}</p>}
              <div className="mt-6">
                <FounderServiceCheckoutButton slug={props.slug} label={props.checkoutLabel} />
              </div>
              <p className="mt-4 text-xs leading-5 text-white/45">Pago seguro mediante Stripe. IVA calculado en el checkout.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-18">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_360px]">
          <div className="space-y-14">
            <div>
              <h2 className="font-serif text-3xl font-bold">Qué incluye</h2>
              <div className="mt-6 grid gap-3">
                {props.includes.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#D4A017]/18 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                    <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-3xl font-bold">Cómo funciona</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {props.steps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-[#D4A017]/18 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A017]/12 text-sm font-bold text-[#9A6B12]">{index + 1}</span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#4A5A6A]">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-3xl font-bold">Preguntas frecuentes</h2>
              <div className="mt-6 space-y-4">
                {props.faqs.map((faq) => (
                  <div key={faq.q} className="rounded-2xl border border-[#D4A017]/18 bg-white p-5">
                    <h3 className="font-semibold">{faq.q}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#4A5A6A]">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#D4A017]/20 bg-white p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#D4A017]" />
                <h2 className="font-serif text-xl font-bold">Fuentes oficiales</h2>
              </div>
              <div className="mt-5 space-y-4">
                {props.resources.map((resource) => (
                  <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[#D4A017]/14 p-4 transition hover:border-[#D4A017]/45">
                    <span className="flex items-center gap-2 font-semibold text-[#0D1B2A]">
                      {resource.label}<ExternalLink className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#657383]">{resource.note}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#D4A017]/20 bg-[#FFF9E8] p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#A87816]" />
                <h2 className="font-serif text-xl font-bold">Antes de contratar</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#4A5A6A]">
                {props.notes.map((note) => <li key={note}>• {note}</li>)}
              </ul>
            </div>

            {props.related && (
              <div className="rounded-3xl border border-[#D4A017]/20 bg-white p-6">
                <h2 className="font-serif text-xl font-bold">{props.related.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4A5A6A]">{props.related.text}</p>
                <Link href={props.related.href} className="mt-4 inline-flex font-semibold text-[#9A6B12] hover:underline">{props.related.cta} →</Link>
              </div>
            )}

            <a href="https://wa.me/34669045528" className="flex items-center justify-center gap-2 rounded-2xl border border-[#0D1B2A]/12 bg-white px-5 py-3 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
