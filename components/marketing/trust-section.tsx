const trustItems = ['+20 años experiencia', 'Colaboradora AEAT', 'Partner Holded', 'Camerfirma'];

export function TrustSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl">Confianza y respaldo institucional</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {trustItems.map((item) => (
            <li key={item} className="rounded-xl border border-brand-slate/20 p-4">{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
