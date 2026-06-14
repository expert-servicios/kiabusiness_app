import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { TenantEditForm } from '@/components/admin/TenantEditForm';
import { TenantBrandingForm } from '@/components/admin/TenantBrandingForm';
import { TenantUserSection } from '@/components/admin/TenantUserSection';
import { TenantIntegrationsForm } from '@/components/admin/TenantIntegrationsForm';
import { ArrowLeft, Building2 } from 'lucide-react';

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  starter:    { label: 'Starter',    cls: 'bg-blue-100 text-blue-700' },
  pro:        { label: 'Pro',        cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-amber-100 text-amber-800' },
};

async function getTenantDetail(id: string) {
  const admin = getSupabaseAdmin();

  const [tenantResult, profilesResult] = await Promise.all([
    admin.from('tenants').select('*').eq('id', id).single(),
    admin.from('profiles').select('id, full_name, role, created_at').eq('tenant_id', id).order('created_at'),
  ]);

  if (tenantResult.error || !tenantResult.data) return null;

  const users = await Promise.all(
    (profilesResult.data ?? []).map(async (profile) => {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
      return { ...profile, email: authUser?.user?.email ?? null };
    })
  );

  return { tenant: tenantResult.data, users };
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTenantDetail(id);
  if (!detail) notFound();

  const { tenant, users } = detail;
  const badge = PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.starter;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/tenants" className="mt-1 rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d5]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-5 w-5 text-[#d7a33a]" />
            <h1 className="font-serif text-2xl font-bold text-[#07111d]">{tenant.name}</h1>
            <code className="rounded bg-[#f8f4eb] px-1.5 py-0.5 text-xs text-[#29384a]">{tenant.slug}</code>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
            {!tenant.active && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">Inactivo</span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#29384a]">
            Creado {new Date(tenant.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Settings */}
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <h2 className="mb-5 font-semibold text-[#07111d]">Configuración</h2>
        <TenantEditForm
          tenant={{
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            plan: tenant.plan as 'starter' | 'pro' | 'enterprise',
            active: tenant.active,
          }}
        />
      </section>

      {/* Branding */}
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <h2 className="mb-5 font-semibold text-[#07111d]">Marca</h2>
        <TenantBrandingForm tenantId={tenant.id} settings={(tenant.settings as Record<string, unknown>) ?? {}} />
      </section>

      {/* Integrations */}
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <h2 className="mb-5 font-semibold text-[#07111d]">Integraciones</h2>
        <TenantIntegrationsForm tenantId={tenant.id} />
      </section>

      {/* Users */}
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-[#07111d]">Usuarios ({users.length})</h2>
          <p className="text-xs text-[#29384a]/60">Pega el email de un usuario ya registrado para asignarlo a este tenant.</p>
        </div>
        <TenantUserSection tenantId={tenant.id} initialUsers={users} />
      </section>
    </div>
  );
}
