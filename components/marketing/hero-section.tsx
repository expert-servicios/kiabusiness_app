export function HeroSection() {
  return (
    <section className="hero-gradient relative overflow-hidden px-6 py-20 text-brand-cream lg:py-24">
      <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full border border-brand-lightGold/20" />
      <div className="absolute -bottom-40 right-0 h-96 w-[42rem] rounded-full border-t border-brand-lightGold/40" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-lg font-medium text-brand-lightGold">ASESORÍA FISCAL</p>
          <h1 className="mt-2 font-serif text-5xl leading-tight lg:text-7xl">
            EN ESPAÑA
            <span className="mt-2 block text-3xl text-brand-cream lg:text-4xl">Para residentes y expatriados</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-gray">
            Presentamos tu declaración, optimizamos impuestos y evitamos errores con Hacienda.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-lg bg-[#16a34a] px-6 py-3 font-semibold text-white">Hablar por WhatsApp</button>
            <button className="rounded-lg border border-brand-lightGold px-6 py-3 font-semibold text-brand-lightGold">
              Ver servicios
            </button>
          </div>

          <ul className="mt-10 grid gap-3 text-sm text-brand-cream/90 sm:grid-cols-3">
            <li className="rounded-lg border border-brand-lightGold/20 bg-brand-slate/20 px-3 py-2">+20 años de experiencia</li>
            <li className="rounded-lg border border-brand-lightGold/20 bg-brand-slate/20 px-3 py-2">Colaboradora social AEAT</li>
            <li className="rounded-lg border border-brand-lightGold/20 bg-brand-slate/20 px-3 py-2">Especialistas en expatriados</li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="aspect-[4/5] rounded-[2rem] border border-brand-lightGold/40 bg-gradient-to-b from-brand-slate to-brand-navy p-6 shadow-2xl shadow-black/40">
            <div className="h-full rounded-[1.5rem] border border-brand-lightGold/20 bg-brand-navy/40 p-8">
              <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-brand-lightGold/30 bg-brand-slate/30 text-center">
                <p className="max-w-[14rem] text-sm text-brand-gray">
                  Zona visual preparada para avatar profesional + marca FX (cuando estén los assets finales).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
