import { LeadForm } from '@/components/forms/lead-form';

export default function SolicitarPresupuestoPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl">Solicitar presupuesto</h1>
      <p className="mt-3 text-brand-slate">Completamos propuesta personalizada según categoría, urgencia y perfil fiscal.</p>
      <div className="mt-8">
        <LeadForm />
      </div>
    </main>
  );
}
