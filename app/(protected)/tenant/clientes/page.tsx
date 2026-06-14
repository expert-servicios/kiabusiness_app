import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { User } from 'lucide-react';

async function getTenantClients(userId: string) {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) return [];

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, phone, created_at')
    .eq('tenant_id', tenantId)
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  // Enrich with auth email
  const enriched = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data: authUser } = await admin.auth.admin.getUserById(p.id);
      return { ...p, email: authUser?.user?.email ?? null };
    })
  );

  return enriched;
}

export default async function TenantClientesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const clients = await getTenantClients(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111d]">Clientes</h1>
        <p className="mt-1 text-sm text-[#29384a]">{clients.length} cliente{clients.length !== 1 ? 's' : ''} en tu asesoría.</p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center">
          <User className="mx-auto mb-3 h-8 w-8 text-[#d8cbb5]" />
          <p className="text-sm font-semibold text-[#29384a]">Todavía no tienes clientes</p>
          <p className="mt-1 text-xs text-[#29384a]/60">
            Cuando el administrador de EXPERT invite a un cliente y lo asigne a tu asesoría, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-2xl border border-[#d8cbb5] bg-white px-5 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f4eb]">
                <User className="h-4 w-4 text-[#d7a33a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#07111d]">
                  {c.full_name ?? c.email ?? 'Sin nombre'}
                </p>
                {c.full_name && c.email && (
                  <p className="truncate text-xs text-[#29384a]">{c.email}</p>
                )}
                {c.phone && <p className="text-xs text-[#29384a]/60">{c.phone}</p>}
              </div>
              <span className="shrink-0 text-xs text-[#29384a]/40">
                {new Date(c.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
