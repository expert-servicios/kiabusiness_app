const howItWorks = [
  {
    title: 'Nos envías tu documentación',
    text: 'Por WhatsApp, email o plataforma segura. Nos adaptamos a ti.'
  },
  {
    title: 'Revisamos tu caso',
    text: 'Analizamos tu situación y te proponemos la mejor opción.'
  },
  {
    title: 'Gestionamos el trámite',
    text: 'Nos encargamos del proceso para que no tengas que preocuparte.'
  }
];

export function HowItWorks() {
  return (
    <section className="bg-[#F8F6F1] py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold uppercase tracking-wide">Así de fácil</h2>
        <div className="mx-auto mt-4 h-[2px] w-20 bg-[#D4A017]" />

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="relative rounded-3xl bg-white p-8 shadow-[0_18px_45px_rgba(13,27,42,0.08)]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#D4A017]/25 bg-[#F8F6F1] text-3xl font-bold text-[#D4A017] shadow-sm">
                {index + 1}
              </div>

              <h3 className="mt-5 font-serif text-lg font-bold uppercase">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#23364D]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
