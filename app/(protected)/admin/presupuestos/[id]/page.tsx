import Link from 'next/link';
import { ArrowLeft, FileText, User, CreditCard, CheckSquare, ExternalLink } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { AdminQuoteCard } from '@/components/quotes/AdminQuoteCard';
import { QuoteResendButton } from '@/components/admin/QuoteResendButton';
import { HoldedSyncButton } from '@/components/admin/HoldedSyncButton';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  paid: 'Pagado',
  expired: 'Expirado'
};

interface QuoteDetail {
  id: string;
  title: string;
  description: string | null;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  client_id: string | null;
  lead_id: string | null;
  stripe_checkout_id: string | null;
  docs_checklist: string[] | null;
  lead: { name: string | null; email: string | null } | null;
  client: { full_name: string | null; email: string | null } | null;
  stripeCheckoutUrl: string | null;
}

async function fetchQuoteDetail(id: string): Promise<QuoteDetail | null> {
  const data = await fetchWithCookies<{ quote: QuoteDetail }>(`/api/admin/quotes/${id}`);
  return data?.quote ?? null;
}

export default async function AdminQuoteDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const quote = await fetchQuoteDetail(id);

  if (!quote) {
    return (
      <main className="min-h-screen bg-[#f8f4eb] py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/admin/presupuestos" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-4 w-4" /> Volver a presupuestos
          </Link>
          <p className="mt-8 text-[#29384a]">Presupuesto no encontrado.</p>
        </div>
      </main>
    );
  }

  const contactName = quote.client?.full_name ?? quote.lead?.name ?? '—';
  const contactEmail = quote.client?.email ?? quote.lead?.email ?? '—';
  const isRegistered = !!quote.client_id;
  const checklist = Array.isArray(quote.docs_checklist) ? quote.docs_checklist : [];

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl space-y-4 px-6">

        <Link href="/admin/presupuestos" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
          <ArrowLeft className="h-4 w-4" /> Volver a presupuestos
        </Link>

        {/* Summary header */}
        <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#c88b25]" />
              <div>
                <p className="text-sm font-semibold text-[#07111d]">{quote.title}</p>
                <p className="mt-1 text-xs text-[#29384a]">
                  Creado el {new Date(quote.created_at).toLocaleDateString('es-ES')}
                  {quote.expires_at
                    ? ` · Vence el ${new Date(quote.expires_at).toLocaleDateString('es-ES')}`
                    : ''}
                </p>
                {quote.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-[#29384a]">{quote.description}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="inline-flex items-center rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
                {STATUS_LABELS[quote.status] ?? quote.status}
              </span>
              <span className="text-lg font-bold text-[#07111d]">{Number(quote.amount_eur).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">
              {isRegistered ? 'Cliente registrado' : 'Lead / Solicitud'}
            </p>
          </div>
          <div className="grid gap-1 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-[#29384a]">Nombre</p>
              <p className="font-semibold text-[#07111d]">{contactName}</p>
            </div>
            <div>
              <p className="text-xs text-[#29384a]">Email</p>
              <a href={`mailto:${contactEmail}`} className="font-semibold text-[#c88b25] hover:underline">
                {contactEmail}
              </a>
            </div>
          </div>
        </div>

        {/* Payment link */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Enlace de pago</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {quote.stripeCheckoutUrl ? (
              <a
                href={quote.stripeCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir sesión Stripe
              </a>
            ) : (
              <p className="text-sm text-[#29384a]">Sin sesión de pago activa.</p>
            )}
            <QuoteResendButton quoteId={quote.id} />
          </div>
        </div>

        {/* Docs checklist */}
        {checklist.length > 0 && (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Documentos requeridos</p>
            </div>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#07111d]">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c88b25]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Edit card — reuse AdminQuoteCard */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#29384a]">Editar presupuesto</p>
          <AdminQuoteCard
            quote={{
              id: quote.id,
              title: quote.title,
              amount_eur: Number(quote.amount_eur),
              status: quote.status,
              created_at: quote.created_at,
              expires_at: quote.expires_at,
              client_id: quote.client_id
            }}
          />
        </div>

        {/* Holded sync */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Holded</p>
              <p className="mt-1 text-sm text-[#29384a]">Sincronizar este presupuesto como factura proforma en Holded.</p>
            </div>
            <HoldedSyncButton
              endpoint="/api/admin/integrations/holded/sync-quote"
              payload={{ quoteId: quote.id }}
              label="Sync Holded"
            />
          </div>
        </div>

      </div>
    </main>
  );
}
