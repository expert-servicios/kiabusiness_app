import { workSteps } from '@/config/brand';

export function HowItWorks() {
  return (
    <section className="bg-brand-navy py-16 text-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-lightGold/90">Así de fácil</p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-white">Así de fácil</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {workSteps.map((step, index) => (
            <div key={step} className="rounded-[28px] border border-white/10 bg-white/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold text-brand-gold">
                <span className="font-serif text-xl">{index + 1}</span>
              </div>
              <p className="mt-6 text-base leading-7 text-brand-cream/90">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
