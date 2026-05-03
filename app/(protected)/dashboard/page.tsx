import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, FileText, DollarSign, Clock, Zap } from 'lucide-react';

async function fetchWithCookies(path: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function DashboardPage() {
  const [quotesData, casesData, subsData] = await Promise.all([
    fetchWithCookies('/api/quotes'),
    fetchWithCookies('/api/cases'),
    fetchWithCookies('/api/subscriptions')
  ]);

  const quotes: { status: string; amount_eur: number }[] = quotesData?.quotes ?? [];
  const cases: { state: string }[] = casesData?.cases ?? [];
  const subscriptions: { status: string }[] = subsData?.subscriptions ?? [];

  const pendingQuotes = quotes.filter((q) => q.status === 'sent' && q.amount_eur > 0).length;
  const activeCases = cases.filter((c) => c.state !== 'finalizado').length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length;

  const cards = [
    {
      href: '/dashboard/presupuestos',
      label: 'Presupuestos pendientes',
      count: pendingQuotes,
      cta: 'Ver presupuestos →',
      icon: <DollarSign className="h-6 w-6" />,
      bg: 'bg-[#d7a33a]/10',
      color: 'text-[#d7a33a]'
    },
    {
      href: '/dashboard/expedientes',
      label: 'Expedientes activos',
      count: activeCases,
      cta: 'Ver expedientes →',
      icon: <FileText className="h-6 w-6" />,
      bg: 'bg-[#1fae4b]/10',
      color: 'text-[#1fae4b]'
    },
    {
      href: '/dashboard/suscripciones',
      label: 'Suscripciones activas',
      count: activeSubscriptions,
      cta: 'Ver suscripciones →',
      icon: <Zap className="h-6 w-6" />,
      bg: 'bg-[#c88b25]/10',
      color: 'text-[#c88b25]'
    }
  ];

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#07111d]">Mi panel</h1>
              <p className="mt-1 text-[#29384a]">Bienvenido a tu área privada</p>
            </div>
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d7a33a] px-6 py-3 font-semibold text-[#061321] hover:bg-[#f0bf54]"
            >
              <ArrowRight className="h-4 w-4" />
              Nuevo presupuesto
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#29384a]">{card.label}</p>
                  <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{card.count}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.bg} ${card.color}`}>{card.icon}</div>
              </div>
              <p className="mt-4 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-1">
                {card.cta}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[#d8cbb5] bg-white p-8">
          <h2 className="font-serif text-xl font-bold text-[#07111d]">Próximos pasos</h2>
          <div className="mt-6 space-y-4">
            {[
              { n: 1, title: 'Completa tu perfil', desc: 'Añade más información para presupuestos más precisos' },
              { n: 2, title: 'Solicita presupuesto', desc: 'Recibirás propuestas personalizadas en 24 horas' },
              { n: 3, title: 'Revisa y aprueba', desc: 'Acepta el presupuesto y comenzamos el trámite' }
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/10 text-[#d7a33a]">
                  {n}
                </div>
                <div>
                  <p className="font-semibold text-[#07111d]">{title}</p>
                  <p className="mt-1 text-sm text-[#29384a]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeSubscriptions === 0 ? (
          <div className="mt-6 rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 p-6">
            <p className="font-semibold text-[#07111d]">¿Quieres gestión mensual?</p>
            <p className="mt-1 text-sm text-[#29384a]">
              Con nuestros planes de suscripción nos ocupamos de todos tus trámites fiscales y administrativos.{' '}
              <Link href="/dashboard/suscripciones" className="font-semibold text-[#c88b25] underline underline-offset-4">
                Ver planes →
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
