export default async function ServicioDetallePage({
  params
}: {
  params: Promise<{ categoria: string; servicio: string }>;
}) {
  const { categoria, servicio } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif text-4xl">Servicio: {servicio}</h1>
      <p className="mt-4 text-brand-slate">Categoría: {categoria}</p>
    </main>
  );
}
