import Image from 'next/image';
import Link from 'next/link';
import { heroCopy } from '@/config/brand';

const heroBackgroundImage = '/hero/home-hero-background.png';

export function Hero() {
  return (
    <section className="relative isolate min-h-[85vh] overflow-hidden bg-[#0D1B2A] text-[#F8F6F1]">
      <Image
        src={heroBackgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-50 object-cover object-[58%_center]"
      />
      <div className="absolute inset-0 -z-40 bg-gradient-to-r from-[#0D1B2A]/96 via-[#0D1B2A]/78 to-[#0D1B2A]/12" />
      <div className="absolute inset-0 -z-30 bg-gradient-to-t from-[#0D1B2A]/58 via-transparent to-[#0D1B2A]/24" />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-16 lg:px-8">
        <div className="max-w-[630px] lg:ml-[17rem] xl:ml-[19rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#c88b25]">{heroCopy.eyebrow}</p>

          <h1 className="mt-5 font-serif text-5xl font-bold uppercase leading-[0.9] tracking-wide text-[#F8F6F1] md:text-[3.75rem] xl:text-[4.35rem]">
            <span className="block">{heroCopy.title}</span>
            <span className="block text-[#c88b25]">{heroCopy.subtitle}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#9CA3AF] md:text-lg">
            {heroCopy.description}
          </p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] shadow-[0_18px_45px_rgba(13,27,42,0.45)] transition hover:bg-[#b57a1e]"
            >
              Solicitar presupuesto
            </Link>
            <Link
              href="/servicios"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#c88b25] transition hover:bg-[#c88b25] hover:text-[#0D1B2A]"
            >
              Ver servicios
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6">
            {heroCopy.highlights.map((highlight) => (
              <div key={highlight} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#c88b25]" />
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
