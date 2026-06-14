import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  nuevo:               { label: 'Nuevo',              cls: 'bg-slate-100 text-slate-600' },
  pendiente_cliente:   { label: 'Pendiente docs',     cls: 'bg-amber-100 text-amber-700' },
  en_revision:         { label: 'En revisión',        cls: 'bg-blue-100 text-blue-700' },
  listo_para_presentar:{ label: 'Listo',              cls: 'bg-indigo-100 text-indigo-700' },
  presentado:          { label: 'Presentado',         cls: 'bg-purple-100 text-purple-700' },
  finalizado:          { label: 'Finalizado',         cls: 'bg-green-100 text-green-700' },
  bloqueado:           { label: 'Bloqueado',          cls: 'bg-red-100 text-red-700' },
};

async function getTenantCases(userId: string) {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) return [];

  // Get all client IDs in this tenant
  const { data: clients } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'client');

  const clientIds = (clients ?? []).map((c) => c.id);
  if (clientIds.length === 0) return [];

  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.full_name]));

  const { data: cases } = await admin
    .from('cases')
    .select('id, service, category, status, opened_at, closed_at, client_id, admin_note')
    .in('client_id', clientIds)
    .order('opened_at', { ascending: false });

  return (cases ?? []).map((c) => ({
    ...c,
    clientName: clientMap[c.client_id] ?? '—',
  }));
}

export default async function TenantExpedientesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const cases = await getTenantCases(user.id);
  const active = cases.filter((c) => c.status !== 'finalizado');
  const done = cases.filter((c) => c.status === 'finalizado');

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111d]">Expedientes</h1>
        <p className="mt-1 text-sm text-[#29384a]">
          {active.length} activo{active.length !== 1 ? 's' : ''} · {done.length} finalizado{done.length !== 1 ? 's' : ''}
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center">
          <FolderOpen className="mx-auto mb-3 h-8 w-8 text-[#d8cbb5]" />
          <p className="text-sm font-semibold text-[#29384a]">No hay expedientes todavía</p>
          <p className="mt-1 text-xs text-[#29384a]/60">Los expedientes aparecerán aquí cuando el equipo de EXPERT los cree para tus clientes.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]">
                Activos ({active.length})
              </h2>
              <CaseList cases={active} />
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]">
                Finalizados ({done.length})
              </h2>
              <CaseList cases={done} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CaseList({
  cases,
}: {
  cases: { id: string; service: string | null; status: string; opened_at: string; clientName: string; admin_note: string | null }[];
}) {
  return (
    <div className="space-y-2">
      {cases.map((c) => {
        const badge = STATUS_BADGE[c.status] ?? { label: c.status, cls: 'bg-gray-100 text-gray-600' };
        return (
          <Link
            key={c.id}
            href={`/tenant/expedientes/${c.id}`}
            className="flex items-center gap-4 rounded-2xl border border-[#d8cbb5] bg-white px-5 py-4 transition hover:border-[#d7a33a]/50 hover:shadow-sm"
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-[#d7a33a]" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-[#07111d]">{c.service ?? '—'}</p>
              <p className="text-xs text-[#29384a]">{c.clientName}</p>
              {c.admin_note && (
                <p className="mt-0.5 truncate text-xs italic text-[#29384a]/60">{c.admin_note}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
              <p className="mt-1 text-[10px] text-[#29384a]/50">
                {new Date(c.opened_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short',
                })}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
