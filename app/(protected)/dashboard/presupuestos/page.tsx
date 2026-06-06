import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { CheckoutButton } from '@/components/quotes/CheckoutButton';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface Quote {
  id: string;
  title: string;
  description: string | null;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
}

type StatusConfig = {
  label: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  Icon: React.FC<{ className?: string }>;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Pendiente de revisión', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800',
    cardBorder: 'border-[#d8cbb5]', cardBg: 'bg-[#f8f4eb]', Icon: Clock,
  },
  sent: {
    label: 'Listo para aprobar', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800',
    cardBorder: 'border-blue-200', cardBg: 'bg-blue-50/40', Icon: FileText,
  },
  accepted: {
    label: 'Aceptado', badgeBg: 'bg-green-100', badgeText: 'text-green-800',
    cardBorder: 'border-green-200', cardBg: 'bg-green-50/40', Icon: CheckCircle2,
  },
  paid: {
    label: 'Pagado', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800',
    cardBorder: 'border-emerald-200', cardBg: 'bg-emerald-50/40', Icon: CheckCircle2,
  },
  expired: {
    label: 'Expirado', badgeBg: 'bg-gray-100', badgeText: 'text-gray-500',
    cardBorder: 'border-gray-200', cardBg: 'bg-gray-50', Icon: XCircle,
  },
};

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

async function getQuotes(): Promise<Quote[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(absoluteAppUrl('/api/quotes'), {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.quotes ?? []) as Quote[];
}

export default async function DashboardQuotesPage() {
  const quotes = await getQuotes();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl px-6">

        <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        {/* Page header */}
        <div className="mb-8 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Presupuestos</p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[#07111d]">Tus presupuestos</h1>
          <p className="mt-1 text-sm text-[#29384a]">
            {quotes.length === 0
              ? 'Aquí aparecerán tus propuestas de servicio.'
              : `${quotes.length} presupuesto${quotes.length !== 1 ? 's' : ''} en total`}
          </p>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-10 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-[#d8cbb5]" />
            <p className="font-semibold text-[#29384a]">Aún no tienes presupuestos</p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Solicita un presupuesto y recibirás una propuesta personalizada en menos de 24 horas.
            </p>
            <Link
              href="/solicitar-presupuesto"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-6 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
            >
              Solicitar presupuesto
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => {
              const cfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.draft;
              const { Icon } = cfg;
              const remaining = daysLeft(quote.expires_at);
              const isPayable = quote.status === 'sent' && quote.amount_eur > 0;
              const isExpiringSoon = remaining !== null && remaining <= 3 && remaining > 0 && isPayable;

              return (
                <div
                  key={quote.id}
                  className={`rounded-2xl border p-6 ${cfg.cardBorder} ${cfg.cardBg}`}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/70 p-2">
                        <Icon className="h-5 w-5 text-[#c88b25]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#07111d]">{quote.title}</p>
                        <p className="mt-0.5 text-xs text-[#29384a]">
                          Recibido el {new Date(quote.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Description */}
                  {quote.description && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#29384a]">
                      {quote.description}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#29384a]">
                      {quote.amount_eur > 0 && (
                        <span className="font-bold text-[#07111d] text-lg">
                          {quote.amount_eur.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                      {quote.expires_at && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${isExpiringSoon ? 'text-red-600 font-semibold' : 'text-[#29384a]/60'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {remaining !== null && remaining > 0
                            ? `Válido ${remaining} día${remaining !== 1 ? 's' : ''} más`
                            : remaining === 0
                            ? 'Vence hoy'
                            : `Venció el ${new Date(quote.expires_at).toLocaleDateString('es-ES')}`}
                        </span>
                      )}
                    </div>

                    {isPayable && (
                      <div className="shrink-0">
                        <CheckoutButton quoteId={quote.id} />
                      </div>
                    )}

                    {quote.status === 'paid' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pago recibido — gracias
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
