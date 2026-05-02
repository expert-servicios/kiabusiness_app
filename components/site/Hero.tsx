import Image from 'next/image';
import Link from 'next/link';
import { heroCopy } from '@/config/brand';

const heroBackgroundImage = '/hero/home-hero-background.png';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#07111d] text-white">
      <Image
        src={heroBackgroundImage}
        alt="Fondo de asesoría fiscal y legal"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-50 object-cover object-[55%_center]"
      />
      <div className="absolute inset-0 -z-40 bg-gradient-to-br from-[#07111d]/96 via-[#07111d]/80 to-[#0d1b2a]/80" />
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_top_right,rgba(200,139,37,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d7a33a]/90">{heroCopy.eyebrow}</p>

          <h1 className="mt-6 text-5xl font-serif font-bold uppercase tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            {heroCopy.title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[#d2dae0] sm:text-lg">
            {heroCopy.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href={heroCopy.primaryAction.href}
              className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#c88b25] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] shadow-[0_20px_55px_rgba(200,139,37,0.3)] transition hover:bg-[#b57a1e]"
            >
              {heroCopy.primaryAction.label}
            </Link>
            <Link
              href={heroCopy.secondaryAction.href}
              className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#c88b25] hover:bg-white/20"
            >
              {heroCopy.secondaryAction.label}
            </Link>
          </div>

          <p className="mt-8 max-w-2xl text-sm leading-7 text-[#cfd8e1]">
            {heroCopy.description}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {heroCopy.highlights.map((highlight) => (
              <div key={highlight} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-[#e3e8ef] shadow-[0_18px_35px_rgba(0,0,0,0.12)]">
                <span className="block font-semibold text-white">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
