import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { Building2, Plus, Users, Globe } from 'lucide-react';

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  starter:    { label: 'Starter',    cls: 'bg-blue-100 text-blue-700' },
  pro:        { label: 'Pro',        cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-amber-100 text-amber-800' },
};

async function getTenants() {
  const admin = getSupabaseAdmin();
  const { data: tenants } = await admin
    .from('tenants')
    .select('id, slug, name, domain, plan, active, created_at')
    .order('created_at', { ascending: false });

  const tenantIds = (tenants ?? []).map((t) => t.id);
  const countMap: Record<string, number> = {};
  if (tenantIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('tenant_id')
      .in('tenant_id', tenantIds);
    for (const p of (profiles ?? [])) {
      if (p.tenant_id) countMap[p.tenant_id] = (countMap[p.tenant_id] ?? 0) + 1;
    }
  }

  return (tenants ?? []).map((t) => ({ ...t, user_count: countMap[t.id] ?? 0 }));
}

export default async function TenantsPage() {
  const tenants = await getTenants();
  const expert = tenants.find((t) => t.slug === 'expert');
  const external = tenants.filter((t) => t.slug !== 'expert');

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Tenants</h1>
          <p className="mt-1 text-sm text-[#29384a]">Asesorías y despachos que usan la plataforma EXPERT.</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-4 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25]"
        >
          <Plus className="h-4 w-4" /> Nuevo tenant
        </Link>
      </div>

      {/* EXPERT (platform tenant) */}
      {expert && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]">Plataforma</h2>
          <TenantCard tenant={expert} />
        </section>
      )}

      {/* External tenants */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]">
          Asesorías ({external.length})
        </h2>
        {external.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-[#d8cbb5]" />
            <p className="text-sm font-semibold text-[#29384a]">Aún no hay asesorías externas</p>
            <p className="mt-1 text-xs text-[#29384a]/60">Crea la primera para empezar el piloto SaaS.</p>
            <Link
              href="/admin/tenants/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#d7a33a] hover:underline"
            >
              <Plus className="h-4 w-4" /> Crear primer tenant
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {external.map((t) => <TenantCard key={t.id} tenant={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function TenantCard({
  tenant,
}: {
  tenant: {
    id: string; slug: string; name: string; domain: string | null;
    plan: string; active: boolean; created_at: string; user_count: number;
  };
}) {
  const badge = PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.starter;
  return (
    <Link
      href={`/admin/tenants/${tenant.id}`}
      className="flex items-center gap-4 rounded-2xl border border-[#d8cbb5] bg-white p-5 transition hover:border-[#d7a33a]/50 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8f4eb]">
        <Building2 className="h-5 w-5 text-[#d7a33a]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#07111d]">{tenant.name}</span>
          <code className="rounded bg-[#f8f4eb] px-1.5 py-0.5 text-[10px] text-[#29384a]">{tenant.slug}</code>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
          {!tenant.active && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Inactivo</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#29384a]">
          {tenant.domain && (
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{tenant.domain}</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{tenant.user_count} usuario{tenant.user_count !== 1 ? 's' : ''}</span>
          <span>Creado {new Date(tenant.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <span className="shrink-0 text-[#d8cbb5]">›</span>
    </Link>
  );
}
