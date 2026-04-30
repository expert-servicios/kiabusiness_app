import Link from 'next/link';
import { privateAreaCopy } from '@/config/brand';

export function PrivateAreaCTA() {
  return (
    <section className="bg-brand-cream py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-[32px] border border-brand-gold/30 bg-brand-navy p-10 shadow-[0_30px_80px_rgba(13,27,42,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-brand-lightGold/90">Área privada</p>
              <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-white">{privateAreaCopy.title}</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-brand-cream/80">{privateAreaCopy.description}</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={privateAreaCopy.primaryAction.href}
                className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition hover:bg-brand-lightGold"
              >
                {privateAreaCopy.primaryAction.label}
              </Link>
              <Link
                href={privateAreaCopy.secondaryAction.href}
                className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-brand-cream/20 bg-white/5 px-6 py-3 text-sm font-semibold text-brand-cream transition hover:bg-white/10"
              >
                {privateAreaCopy.secondaryAction.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
