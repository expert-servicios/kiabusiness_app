const steps = [
  {
    title: 'Envías tu documentación',
    description: 'Nos envías tus datos y documentos de forma segura.'
  },
  {
    title: 'Revisamos tu caso',
    description: 'Analizamos tu situación y buscamos la mejor opción para ti.'
  },
  {
    title: 'Presentamos tu declaración',
    description: 'Nos encargamos de todo y te informamos del resultado.'
  }
];

const testimonials = [
  'Muy profesional y atenta. Me ayudó con mi renta como expatriado y todo fue perfecto.',
  'Excelente servicio, rápido y claro. Pagué menos impuestos de forma legal y sin complicaciones.',
  'Me ayudó con la nacionalidad de mi hijo. Todo el proceso fue fácil y acompañado.'
];

export function PrivateAreaCTA() {
  return (
    <>
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-serif text-5xl text-brand-navy">Así de fácil</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-brand-slate/15 p-8 text-center">
                <p className="text-sm font-semibold text-brand-gold">0{index + 1}</p>
                <h3 className="mt-3 font-serif text-3xl text-brand-navy">{step.title}</h3>
                <p className="mt-4 text-brand-slate">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-gradient px-6 py-20 text-brand-cream">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-serif text-5xl">Lo que dicen nuestros clientes</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((review, idx) => (
              <article key={review} className="rounded-2xl border border-brand-lightGold/30 bg-brand-slate/20 p-6">
                <p className="text-brand-lightGold">★★★★★</p>
                <p className="mt-4 text-brand-cream/95">{review}</p>
                <p className="mt-4 text-sm text-brand-gray">Cliente verificado #{idx + 1}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid items-center gap-6 rounded-2xl border border-brand-lightGold/25 bg-brand-slate/30 p-8 md:grid-cols-2">
            <div>
              <p className="font-serif text-4xl leading-tight">
                Nos ocupamos de todo. <span className="text-brand-lightGold">Tú solo envías los datos.</span>
              </p>
              <p className="mt-3 text-brand-gray">Confía en una profesional y olvídate de preocupaciones.</p>
            </div>
            <div className="text-right">
              <button className="rounded-xl bg-[#16a34a] px-8 py-4 text-lg font-semibold text-white">Hablar por WhatsApp</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
