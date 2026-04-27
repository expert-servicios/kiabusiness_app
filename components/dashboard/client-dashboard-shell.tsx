const sections = ['Resumen', 'Perfil', 'Expedientes', 'Documentos', 'Pagos', 'Suscripciones', 'Presupuestos', 'Mensajes'];

export function ClientDashboardShell() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-serif text-4xl">Área Cliente</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <article key={section} className="rounded-xl bg-white p-5 shadow">{section}</article>
        ))}
      </div>
    </main>
  );
}
