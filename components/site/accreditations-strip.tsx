import { accreditationItems } from '@/config/brand';

export function AccreditationsStrip() {
  return (
    <section className="bg-[#F8F6F1] py-10 text-[#0D1B2A]">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-xl font-bold uppercase tracking-wide">
          Colaboraciones y acreditaciones oficiales
        </h2>
        <div className="mx-auto mt-3 h-[2px] w-20 bg-[#c88b25]" />

        <div className="mt-8 grid grid-cols-2 items-center gap-5 text-center text-lg font-semibold text-[#23364D]/45 md:grid-cols-5">
          {accreditationItems.map((item) => (
            <div key={item.label}>{item.label}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
