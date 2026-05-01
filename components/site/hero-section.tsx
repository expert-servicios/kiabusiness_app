import Image from 'next/image';
import Link from 'next/link';
import { heroCopy } from '@/config/brand';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-brand-cream">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand-gold/10" />

      <div className="mx-auto grid min-h-[720px] max-w-[1200px] items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
        <div className="relative z-10">
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-brand-lightGold/90">{heroCopy.eyebrow}</p>
          <h1 className="max-w-3xl font-serif text-5xl tracking-[-0.04em] leading-[1.05] text-white sm:text-6xl">
            {heroCopy.title}
          </h1>
          <p className="mt-4 text-xl font-semibold text-brand-cream/90">{heroCopy.subtitle}</p>
          <p className="mt-6 max-w-2xl text-base leading-8 text-brand-cream/90">{heroCopy.description}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={heroCopy.primaryAction.href}
              className="inline-flex items-center justify-center rounded-full border border-brand-gold bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition hover:bg-brand-lightGold"
            >
              {heroCopy.primaryAction.label}
            </Link>
            <Link
              href={heroCopy.secondaryAction.href}
              className="inline-flex items-center justify-center rounded-full border border-brand-cream/20 bg-white/5 px-6 py-3 text-sm font-semibold text-brand-cream transition hover:bg-brand-slate"
            >
              {heroCopy.secondaryAction.label}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-brand-cream/80">
            {heroCopy.highlights.map((item) => (
              <span key={item} className="rounded-full border border-brand-cream/10 bg-white/5 px-4 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-brand-gold/30 bg-brand-slate/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 opacity-10">
              <Image src="/expert-isotipo.png" alt="EXPERT isotipo" fill className="object-contain" />
            </div>
            <div className="relative rounded-[28px] border border-brand-cream/10 bg-brand-navy p-4">
              <div className="overflow-hidden rounded-full border border-brand-gold/20 bg-brand-slate p-1">
                <Image
                  src="/avatars/ksenia-avatar.png"
                  alt="Avatar de Ksenia"
                  width={420}
                  height={420}
                  className="aspect-square h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-brand-gold/20 bg-brand-navy/80 px-5 py-4 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-brand-lightGold/90">Asesoría premium</p>
              <p className="mt-3 text-base leading-7 text-brand-cream/80">Atención personalizada, confidencial y con experiencia fiscal.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
