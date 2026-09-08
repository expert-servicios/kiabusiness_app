import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Building2, Download, ExternalLink, ReceiptText } from 'lucide-react';
import { CustomerPortalButton } from '@/components/subscriptions/CustomerPortalButton';
import { SubscriptionPlanCards } from '@/components/subscriptions/SubscriptionPlanCards';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface SubscriptionRecord {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
}

interface CompanyContext {
  id: string;
  razon_social: string;
  forma_juridica: string;
}

interface CompanyCoverage {
  covered: boolean;
  source: 'direct_subscription' | 'trial' | 'included_entity' | 'none';
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
  primaryCompanyId: string | null;
  primaryCompanyName: string | null;
  coverageScope: string | null;
  validFrom: string | null;
  validUntil: string | null;
  excludedServices: string[];
}

interface BillingInvoice {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
  createdAt: string;
  dueDate: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  trialing: { label: 'Prueba', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  past_due: { label: 'Pago pendiente', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  canceled: { label: 'Cancelada', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600' },
  unpaid: { label: 'Sin pagar', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' }
};

const invoiceStatus: Record<string, { label: string; className: string }> = {
  paid: { label: 'Pagada', className: 'bg-green-100 text-green-800' },
  open: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  void: { label: 'Anulada', className: 'bg-gray-100 text-gray-600' },
  uncollectible: { label: 'Incobrable', className: 'bg-red-100 text-red-800' },
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);
}

async function getSubscriptions(): Promise<{ subscriptions: SubscriptionRecord[]; company: CompanyContext | null; coverage: CompanyCoverage | null }> {
  const data = await fetchWithCookies<{ subscriptions: SubscriptionRecord[]; company: CompanyContext | null; coverage: CompanyCoverage | null }>('/api/subscriptions');
  return { subscriptions: data?.subscriptions ?? [], company: data?.company ?? null, coverage: data?.coverage ?? null };
}

async function getInvoices(): Promise<BillingInvoice[]> {
  const data = await fetchWithCookies<{ invoices: BillingInvoice[] }>('/api/billing/invoices');
  return data?.invoices ?? [];
}

interface PageProps {
  searchParams: Promise<{ billing?: string; plan?: string }>;
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialBilling: 'mensual' | 'anual' = params.billing === 'anual' ? 'anual' : 'mensual';

  const [{ subscriptions, company, coverage }, invoices] = await Promise.all([getSubscriptions(), getInvoices()]);
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const hasDirectActive = activeSubscriptions.length > 0;
  const hasCoverage = Boolean(coverage?.covered);
  const includedEntity = coverage?.source === 'included_entity';

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Suscripciones</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Tus suscripciones</h1>
            </div>
            {hasDirectActive ? <CustomerPortalButton /> : null}
          </div>

          {company ? (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#e7dcc7] bg-[#f8f4eb] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d7a33a]/15 text-[#a86f16]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a7963]">Entidad activa</p>
                <p className="text-sm font-semibold text-[#07111d]">{company.razon_social}</p>
                <p className="text-xs text-[#6f6254]">
                  {company.forma_juridica === 'autonomo' ? 'Empresario individual / autónomo' : 'Sociedad / entidad'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Selecciona o crea una entidad fiscal antes de contratar una suscripción.
            </div>
          )}

          {includedEntity && coverage ? (
            <div className="mb-10 rounded-3xl border border-green-200 bg-green-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-800">Entidad incluida</p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-[#07111d]">Cobertura activa sin segunda cuota</h2>
                  <p className="mt-2 text-sm text-[#29384a]">
                    Esta entidad está incluida en {coverage.planName ?? 'el plan activo'}{coverage.primaryCompanyName ? ` de ${coverage.primaryCompanyName}` : ''}.
                  </p>
                  <p className="mt-2 text-xs text-[#6f6254]">
                    No necesitas contratar otro plan. La facturación y el portal de pago se gestionan desde la entidad contratante.
                  </p>
                  {coverage.excludedServices.length > 0 ? (
                    <p className="mt-2 text-xs text-[#6f6254]">Servicios no incluidos en esta cobertura: {coverage.excludedServices.join(', ')}.</p>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-800">
                  <CheckCircle2 className="h-4 w-4" /> Activa
                </span>
              </div>
            </div>
          ) : null}

          {subscriptions.length > 0 ? (
            <div className="mb-10 space-y-4">
              {subscriptions.map((sub: SubscriptionRecord) => {
                const cfg = statusConfig[sub.status] ?? statusConfig.canceled;
                return (
                  <div key={sub.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#07111d]">{sub.plan_name}</p>
                        <p className="mt-1 text-xs text-[#29384a]">Desde {new Date(sub.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    {sub.current_period_end ? <p className="mt-3 text-sm text-[#29384a]">Próxima renovación: <strong>{new Date(sub.current_period_end).toLocaleDateString('es-ES')}</strong></p> : null}
                    {sub.canceled_at ? <p className="mt-3 text-sm text-red-600">Cancelada el {new Date(sub.canceled_at).toLocaleDateString('es-ES')}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {company && !includedEntity && (hasDirectActive || invoices.length > 0) ? (
            <section className="mb-10 border-t border-[#e7dcc7] pt-8">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/15 text-[#a86f16]"><ReceiptText className="h-4 w-4" /></div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#07111d]">Facturas y pagos</h2>
                  <p className="mt-1 text-xs text-[#6f6254]">Estado en tiempo real de las facturas emitidas por Stripe para la entidad activa.</p>
                </div>
              </div>
              {invoices.length ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const cfg = invoiceStatus[invoice.status ?? ''] ?? { label: invoice.status ?? 'Sin estado', className: 'bg-gray-100 text-gray-700' };
                    return (
                      <div key={invoice.id} className="rounded-2xl border border-[#e7dcc7] bg-[#faf8f2] px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#07111d]">{invoice.number ?? 'Factura Stripe'}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.className}`}>{cfg.label}</span>
                            </div>
                            <p className="mt-1 text-xs text-[#6f6254]">Emitida el {new Date(invoice.createdAt).toLocaleDateString('es-ES')}{invoice.dueDate ? ` · vence ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}` : ''}</p>
                            <p className="mt-2 text-sm text-[#29384a]">Total: <strong>{money(invoice.amountDue, invoice.currency)}</strong>{invoice.amountRemaining > 0 ? ` · Pendiente: ${money(invoice.amountRemaining, invoice.currency)}` : ''}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.hostedInvoiceUrl ? <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold text-[#29384a]"><ExternalLink className="h-3.5 w-3.5" />Ver factura</a> : null}
                            {invoice.invoicePdf ? <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold text-[#29384a]"><Download className="h-3.5 w-3.5" />PDF</a> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="rounded-2xl border border-[#e7dcc7] bg-[#faf8f2] px-5 py-4 text-sm text-[#6f6254]">Todavía no hay facturas de Stripe para esta entidad.</div>}
            </section>
          ) : null}

          {!hasCoverage && company ? (
            <div>
              <p className="mb-8 text-[#29384a]">{subscriptions.length > 0 ? 'La suscripción de esta entidad ha finalizado. Elige un plan para retomar el servicio.' : `Elige el plan que contratará ${company.razon_social}.`}</p>
              <SubscriptionPlanCards
                planSupervisionMonthlyId={process.env.STRIPE_PLAN_MONTHLY_49 ?? ''}
                planAvanzadoMonthlyId={process.env.STRIPE_PLAN_MONTHLY_99 ?? ''}
                planColaborativoMonthlyId={process.env.STRIPE_PLAN_MONTHLY_199 ?? ''}
                planSupervisionAnnualId={process.env.STRIPE_PLAN_ANNUAL_49 ?? ''}
                planAvanzadoAnnualId={process.env.STRIPE_PLAN_ANNUAL_99 ?? ''}
                planColaborativoAnnualId={process.env.STRIPE_PLAN_ANNUAL_199 ?? ''}
                initialBilling={initialBilling}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
