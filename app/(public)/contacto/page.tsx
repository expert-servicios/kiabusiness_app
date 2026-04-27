import { LeadForm } from '@/components/forms/lead-form';

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl">Contacto</h1>
      <p className="mt-3 text-brand-slate">Cuéntanos tu necesidad y te responderemos en menos de 24h hábiles.</p>
      <div className="mt-8">
        <LeadForm />
      </div>
    </main>
  );
}
