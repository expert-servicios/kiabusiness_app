import Link from 'next/link';

const PLANS = [
  { slug: 'supervision', name: 'Plan Supervisión', price: '49', href: '/planes/supervision' },
  { slug: 'avanzado', name: 'Plan Avanzado', price: '99', href: '/planes/avanzado' },
  { slug: 'colaborativo', name: 'Plan Colaborativo', price: '199', href: '/planes/colaborativo' },
  { slug: 'personalizado', name: 'Plan Personalizado', price: null, href: '/planes/presupuesto-personalizado' }
] as const;

export function PlanComparison({ current }: { current: 'supervision' | 'avanzado' | 'colaborativo' }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-serif text-2xl font-bold">Compara los planes</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Link
              key={plan.slug}
              href={plan.href}
              className={`border p-6 text-center transition hover:-translate-y-0.5 ${
                plan.slug === current
                  ? 'border-[#D4A017] bg-white shadow-[0_12px_32px_rgba(13,27,42,0.12)]'
                  : 'border-[#D4A017]/25 bg-white hover:border-[#D4A017]'
              }`}
            >
              {plan.slug === current && (
                <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#D4A017]">Plan actual</span>
              )}
              <p className="font-serif text-xl font-bold">{plan.name}</p>
              {plan.price ? (
                <p className="mt-2 font-serif text-3xl font-bold text-[#D4A017]">
                  {plan.price} <span className="text-sm font-normal text-[#9CA3AF]">€/mes</span>
                </p>
              ) : (
                <p className="mt-2 font-serif text-xl font-bold text-[#D4A017]">A medida</p>
              )}
              {plan.slug !== current && (
                <p className="mt-3 text-sm font-semibold text-[#D4A017]">Ver plan →</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
