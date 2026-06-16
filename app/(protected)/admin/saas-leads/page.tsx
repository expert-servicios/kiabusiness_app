import Link from 'next/link';
import { ArrowLeft, Building2, Mail, MessageSquare, Phone, Users } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { LeadStatusSelect } from '@/components/admin/LeadStatusSelect';
import { HoldedSyncButton } from '@/components/admin/HoldedSyncButton';

interface SaasLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string;
  client_count_range: string;
  current_tools: string | null;
  operational_problem: string;
  pilot_interest: string;
  status: string;
  source: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: 'Nuevo',      color: 'text-amber-800',  bg: 'bg-amber-100 border-amber-200' },
  contacted: { label: 'Contactado', color: 'text-blue-800',   bg: 'bg-blue-100 border-blue-200' },
  qualified: { label: 'Cualificado',color: 'text-green-800',  bg: 'bg-green-100 border-green-200' },
  rejected:  { label: 'Descartado', color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200' }
};

async function getLeads(): Promise<SaasLead[]> {
  const data = await fetchWithCookies<{ leads: SaasLead[] }>('/api/admin/saas-leads');
  return data?.leads ?? [];
}

export default async function AdminSaasLeadsPage() {
  const leads = await getLeads();

  const newCount = leads.filter((l) => l.status === 'new').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-7">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Panel admin
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Leads SaaS — Para asesorías</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                Solicitudes de asesorías interesadas en el piloto de la plataforma
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-center">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-amber-800">{newCount}</p>
                <p className="text-xs text-amber-700">Nuevos</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-green-800">{qualifiedCount}</p>
                <p className="text-xs text-green-700">Cualificados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Sin leads todavía</h2>
            <p className="mt-2 text-sm text-[#29384a]">
              Cuando asesorías envíen el formulario de{' '}
              <Link href="/para-asesorias" className="text-[#c88b25] underline underline-offset-4">
                /para-asesorias
              </Link>
              , aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
              const date = new Date(lead.created_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric'
              });

              return (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm"
                >
                  {/* Lead header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10 text-[#c88b25]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-serif text-base font-bold text-[#07111d]">{lead.company_name}</p>
                        <p className="mt-0.5 text-sm text-[#29384a]">{lead.name}</p>
                        <p className="text-xs text-[#29384a]">{date}</p>
                      </div>
                    </div>
                    <span className={`self-start rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#29384a]">
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 font-semibold text-[#c88b25] hover:underline">
                      <Mail className="h-3.5 w-3.5" />
                      {lead.email}
                    </a>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-[#07111d]">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {lead.client_count_range} clientes aprox.
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 grid gap-4 border-t border-[#f0e8d8] pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Herramientas actuales</p>
                      <p className="mt-1 text-[#29384a]">{lead.current_tools ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Interés en piloto</p>
                      <p className="mt-1 text-[#29384a]">{lead.pilot_interest}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Problema operativo principal</p>
                    <p className="mt-1 text-sm leading-6 text-[#29384a]">{lead.operational_problem}</p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8d8] pt-4">
                    <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                    <div className="flex flex-wrap items-center gap-2">
                      <HoldedSyncButton
                        endpoint="/api/admin/integrations/holded/sync-lead"
                        payload={{ saasLeadId: lead.id }}
                        label="Sync CRM Holded"
                      />
                      <a
                        href={`mailto:${lead.email}?subject=EXPERT SaaS – Piloto para ${encodeURIComponent(lead.company_name)}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#d7a33a] px-4 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Contactar
                      </a>
                    </div>
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
