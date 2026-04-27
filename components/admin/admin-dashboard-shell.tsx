const sections = ['Dashboard métricas', 'Clientes', 'Leads', 'Presupuestos', 'Expedientes', 'Documentos', 'Pagos', 'Suscripciones', 'Reseñas', 'Blog', 'Configuración'];

export function AdminDashboardShell() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-serif text-4xl">Panel de Administración</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section} className="rounded-xl border border-brand-slate/20 bg-white p-5">{section}</article>
        ))}
      </div>
    </main>
  );
}
