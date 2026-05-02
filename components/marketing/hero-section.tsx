export function HeroSection() {
  return (
    <section className="hero-gradient px-6 py-24 text-brand-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-brand-lightGold">Asesoría fiscal en España</p>
          <h1 className="mt-3 font-serif text-5xl">Para empresas y personas físicas</h1>
          <p className="mt-5 max-w-xl text-brand-gray">
            Presentamos tus impuestos, optimizamos tu fiscalidad y evitamos errores con Hacienda.
          </p>
          <div className="mt-8 flex gap-4">
            <button className="rounded-full bg-brand-gold px-6 py-3 font-semibold text-brand-navy">Acceder al panel</button>
            <button className="rounded-full border border-brand-lightGold px-6 py-3">Ver servicios</button>
          </div>
        </div>
        <div className="rounded-3xl border border-brand-lightGold/20 bg-brand-slate/40 p-10">
          <p className="text-center text-sm text-brand-gray">Foto profesional + marca de agua FX</p>
        </div>
      </div>
    </section>
  );
}
