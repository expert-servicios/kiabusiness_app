import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Mail, Phone, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { LeadLifecycleSelect } from '@/components/admin/LeadLifecycleSelect';

type StripeSummary = {
  customer_count: number;
  active_subscription: boolean;
  successful_charges: number;
  succeeded_payment_intents: number;
  paid_invoices: number;
  paid_checkouts: number;
  last_activity_at: string | null;
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
  lifecycle_stage: string;
  stripe_activity: string;
  marketing_status: string;
  last_stripe_activity_at: string | null;
  stripe_summary: StripeSummary;
};

type ApiResponse = {
  leads: Lead[];
  pagination: { page: number; limit: number; total: number; pages: number };
  stats: {
    total: number;
    leads: number;
    prospects: number;
    customers: number;
    former_customers: number;
    subscribed: number;
    paid: number;
    abandoned: number;
    marketing_consented: number;
    marketing_unknown: number;
  };
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const lifecycleLabels: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospecto',
  customer: 'Cliente',
  former_customer: 'Antiguo cliente',
};

const activityLabels: Record<string, string> = {
  no_activity: 'Sin actividad',
  abandoned: 'Abandonado',
  paid: 'Pagado',
  subscribed: 'Suscripción activa',
};

const marketingLabels: Record<string, string> = {
  unknown: 'Consentimiento no acreditado',
  consented: 'Consentido',
  unsubscribed: 'Baja',
  blocked: 'Bloqueado',
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function buildPath(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/admin/leads?${query}` : '/admin/leads';
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = one(params.q);
  const lifecycle = one(params.lifecycle);
  const activity = one(params.activity);
  const marketing = one(params.marketing);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const apiQuery = new URLSearchParams({ page: String(page), limit: '50' });
  if (q) apiQuery.set('q', q);
  if (lifecycle) apiQuery.set('lifecycle', lifecycle);
  if (activity) apiQuery.set('activity', activity);
  if (marketing) apiQuery.set('marketing', marketing);

  const data = await fetchWithCookies<ApiResponse>(`/api/admin/leads?${apiQuery.toString()}`);
  const loadFailed = data === null;
  const leads = data?.leads ?? [];
  const stats = data?.stats ?? {
    total: 0, leads: 0, prospects: 0, customers: 0, former_customers: 0,
    subscribed: 0, paid: 0, abandoned: 0, marketing_consented: 0, marketing_unknown: 0,
  };
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, pages: 1 };

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" /> Panel admin
          </Link>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">CRM EXPERT</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">Contactos y leads</h1>
              <p className="mt-1 text-sm text-[#526171]">
                Leads operativos, historial Stripe y elegibilidad de marketing en una sola vista.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Total', stats.total],
                ['Prospectos', stats.prospects],
                ['Clientes', stats.customers],
                ['Suscritos', stats.subscribed],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-[#e3d8c6] bg-[#fffdf8] px-4 py-3 text-center">
                  <p className="font-serif text-2xl font-bold text-[#07111d]">{value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6f665b]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        {loadFailed && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">No se pudieron cargar los datos del CRM.</p>
              <p className="mt-1 text-xs">Las cifras mostradas no representan el estado real. Recarga la página antes de tomar decisiones.</p>
            </div>
          </div>
        )}

        <div className="mb-5 grid gap-3 rounded-2xl border border-[#ded2bf] bg-white p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
          <form className="contents" action="/admin/leads">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f71]" />
              <input name="q" defaultValue={q} placeholder="Buscar nombre, email o teléfono" className="w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] py-2.5 pl-9 pr-3 text-sm text-[#07111d]" />
            </label>
            <select name="lifecycle" defaultValue={lifecycle} className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm">
              <option value="">Todas las etapas</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospecto</option>
              <option value="customer">Cliente</option>
              <option value="former_customer">Antiguo cliente</option>
            </select>
            <select name="activity" defaultValue={activity} className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm">
              <option value="">Toda actividad Stripe</option>
              <option value="no_activity">Sin actividad</option>
              <option value="abandoned">Abandonado</option>
              <option value="paid">Pagado</option>
              <option value="subscribed">Suscripción activa</option>
            </select>
            <select name="marketing" defaultValue={marketing} className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm">
              <option value="">Todo marketing</option>
              <option value="unknown">Consentimiento no acreditado</option>
              <option value="consented">Consentido</option>
              <option value="unsubscribed">Baja</option>
              <option value="blocked">Bloqueado</option>
            </select>
            <button className="rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white">Filtrar</button>
          </form>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Leads', stats.leads, 'Pendientes de cualificación'],
            ['Prospectos', stats.prospects, `${stats.abandoned} con checkout/pago abandonado`],
            ['Clientes', stats.customers, `${stats.paid} con actividad pagada`],
            ['Antiguos', stats.former_customers, 'Marcados manualmente'],
            ['Marketing', stats.marketing_consented, `${stats.marketing_unknown} sin consentimiento registrado`],
          ].map(([label, value, note]) => (
            <div key={String(label)} className="rounded-xl border border-[#e0d5c3] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8c6a22]">{label}</p>
              <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{value}</p>
              <p className="mt-1 text-xs text-[#6f665b]">{note}</p>
            </div>
          ))}
        </div>

        {loadFailed ? (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-white p-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Datos no disponibles</h2>
            <p className="mt-2 text-sm text-[#6f665b]">No se muestran resultados vacíos para evitar confundir un fallo de carga con una ausencia real de contactos.</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-[#c7b9a2]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">No hay contactos con estos filtros</h2>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#eee6d9] text-sm">
                <thead className="bg-[#fbf7ef] text-left text-[11px] uppercase tracking-wide text-[#756b5f]">
                  <tr>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Etapa CRM</th>
                    <th className="px-4 py-3">Stripe</th>
                    <th className="px-4 py-3">Marketing</th>
                    <th className="px-4 py-3">Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8dc]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="align-top hover:bg-[#fffdf8]">
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10 text-[#b77d16]">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#07111d]">{lead.name}</p>
                            {lead.email && <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-1 text-xs text-[#526171] hover:underline"><Mail className="h-3 w-3" />{lead.email}</a>}
                            {lead.phone && <a href={`tel:${lead.phone}`} className="mt-1 flex items-center gap-1 text-xs text-[#526171] hover:underline"><Phone className="h-3 w-3" />{lead.phone}</a>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <LeadLifecycleSelect leadId={lead.id} currentStage={lead.lifecycle_stage} />
                        <p className="mt-2 text-[11px] text-[#8b8174]">{lifecycleLabels[lead.lifecycle_stage] ?? lead.lifecycle_stage}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full border border-[#dbcaa9] bg-[#fff8e8] px-2 py-1 text-[11px] font-semibold text-[#8a6111]">{activityLabels[lead.stripe_activity] ?? lead.stripe_activity}</span>
                          {lead.stripe_summary.customer_count > 0 && <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">{lead.stripe_summary.customer_count} customer ID{lead.stripe_summary.customer_count === 1 ? '' : 's'}</span>}
                        </div>
                        <p className="mt-2 text-[11px] text-[#6f665b]">
                          {lead.stripe_summary.paid_invoices} facturas · {lead.stripe_summary.successful_charges} cargos
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d3c8] bg-[#faf9f6] px-2 py-1 text-[11px] font-semibold text-[#5f5a52]">
                          <ShieldCheck className="h-3 w-3" />
                          {marketingLabels[lead.marketing_status] ?? lead.marketing_status}
                        </div>
                        {lead.marketing_status === 'unknown' && <p className="mt-2 max-w-48 text-[11px] leading-4 text-[#8b8174]">No habilitado para campañas.</p>}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-[#29384a]">{lead.source ?? 'manual/web'}</p>
                        <p className="mt-1 text-[11px] text-[#8b8174]">{new Date(lead.created_at).toLocaleDateString('es-ES')}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#eee6d9] bg-[#fbf7ef] px-4 py-3 text-xs text-[#665f55]">
              <span>{pagination.total} resultados · página {pagination.page} de {pagination.pages}</span>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Link className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 font-semibold" href={buildPath({ q, lifecycle, activity, marketing, page: String(pagination.page - 1) })}>Anterior</Link>
                )}
                {pagination.page < pagination.pages && (
                  <Link className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 font-semibold" href={buildPath({ q, lifecycle, activity, marketing, page: String(pagination.page + 1) })}>Siguiente</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
