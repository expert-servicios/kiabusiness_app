import { accreditationItems } from '@/config/brand';

export function AccreditationsStrip() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Colaboraciones y acreditaciones</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {accreditationItems.map((item) => (
            <div key={item.label} className="rounded-full border border-brand-navy/10 bg-brand-cream px-5 py-3 text-sm font-medium text-brand-navy">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
