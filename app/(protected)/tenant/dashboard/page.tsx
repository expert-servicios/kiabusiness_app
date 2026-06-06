import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { FolderOpen, Users, Clock, CheckCircle2 } from 'lucide-react';

const STATE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  pendiente_cliente: 'Pendiente docs',
  en_revision: 'En revisión',
  listo_para_presentar: 'Listo para presentar',
  presentado: 'Presentado',
  finalizado: 'Finalizado',
  bloqueado: 'Bloqueado',
};

async function getTenantDashboardData(userId: string) {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) return null;

  // All client profiles in this tenant
  const { data: clients } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'client');

  const clientIds = (clients ?? []).map((c) => c.id);

  if (clientIds.length === 0) {
    return { clientCount: 0, activeCases: [], completedToday: 0 };
  }

  const { data: cases } = await admin
    .from('cases')
    .select('id, service, status, opened_at, client_id')
    .in('client_id', clientIds)
    .order('opened_at', { ascending: false })
    .limit(50);

  const allCases = cases ?? [];
  const activeCases = allCases.filter((c) => c.status !== 'finalizado');
  const today = new Date().toDateString();
  const completedToday = allCases.filter(
    (c) => c.status === 'finalizado' && new Date(c.opened_at).toDateString() === today
  ).length;

  // Enrich with client name
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.full_name]));
  const enriched = activeCases.slice(0, 8).map((c) => ({
    ...c,
    clientName: clientMap[c.client_id] ?? '—',
  }));

  return {
    clientCount: clientIds.length,
    activeCases: enriched,
    completedToday,
  };
}

export default async function TenantDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const data = await getTenantDashboardData(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111d]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#29384a]">Vista general de tu asesoría en la plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5 text-[#d7a33a]" />}
          label="Clientes"
          value={data?.clientCount ?? 0}
        />
        <StatCard
          icon={<FolderOpen className="h-5 w-5 text-[#d7a33a]" />}
          label="Expedientes activos"
          value={data?.activeCases.length ?? 0}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Finalizados hoy"
          value={data?.completedToday ?? 0}
        />
      </div>

      {/* Recent active cases */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#29384a]">
          Expedientes activos
        </h2>
        {!data || data.activeCases.length === 0 ? (
          <EmptyState message="No hay expedientes activos en este momento." />
        ) : (
          <div className="space-y-2">
            {data.activeCases.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-[#d8cbb5] bg-white px-4 py-3"
              >
                <Clock className="h-4 w-4 shrink-0 text-[#d7a33a]" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-[#07111d]">{c.service ?? '—'}</p>
                  <p className="text-xs text-[#29384a]">{c.clientName}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#f0e8d5] px-2 py-0.5 text-[10px] font-semibold text-[#7a6a50]">
                  {STATE_LABELS[c.status] ?? c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8f4eb]">{icon}</div>
      <p className="text-2xl font-bold text-[#07111d]">{value}</p>
      <p className="text-xs font-semibold text-[#29384a]">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-8 text-center">
      <p className="text-sm text-[#29384a]/60">{message}</p>
    </div>
  );
}
