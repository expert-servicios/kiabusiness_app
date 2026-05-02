import Image from 'next/image';
import Link from 'next/link';
import { heroCopy } from '@/config/brand';

const heroBackgroundImage = '/hero/home-hero-background.png';

export function Hero() {
  return (
    <section className="relative isolate min-h-[85vh] overflow-hidden bg-[#0D1B2A] text-[#F8F6F1]">
      <Image
        src={heroBackgroundImage}
        alt="Fondo de asesoría fiscal y legal"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-50 object-cover object-[58%_center]"
      />
      <div className="absolute inset-0 -z-40 bg-gradient-to-r from-[#0D1B2A]/96 via-[#0D1B2A]/78 to-[#0D1B2A]/12" />
      <div className="absolute inset-0 -z-30 bg-gradient-to-t from-[#0D1B2A]/58 via-transparent to-[#0D1B2A]/24" />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-16 lg:px-8">
        <div className="max-w-[680px] lg:ml-[17rem] xl:ml-[19rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#c88b25]">{heroCopy.eyebrow}</p>

          <h1 className="mt-5 font-serif text-5xl font-bold uppercase leading-tight tracking-wide text-[#F8F6F1] md:text-[4rem] xl:text-[4.5rem]">
            {heroCopy.title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-[#cbd2dc] md:text-lg">
            {heroCopy.subtitle}
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={heroCopy.primaryAction.href}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#c88b25] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[#0D1B2A] shadow-[0_18px_45px_rgba(13,27,42,0.26)] transition hover:bg-[#b57a1e] sm:w-auto"
            >
              {heroCopy.primaryAction.label}
            </Link>
            <Link
              href={heroCopy.secondaryAction.href}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#c88b25] hover:bg-white/20 sm:w-auto"
            >
              {heroCopy.secondaryAction.label}
            </Link>
          </div>

          <p className="mt-8 max-w-xl text-sm leading-7 text-[#9CA3AF]">
            {heroCopy.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {heroCopy.highlights.map((highlight) => (
              <span key={highlight} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#D8CBB5]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c88b25]" />
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
