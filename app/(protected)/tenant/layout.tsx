import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getTenantForUser } from '@/lib/auth/tenant';
import { TenantSidebar } from '@/components/tenant/TenantSidebar';

export const metadata: Metadata = {
  title: 'Portal asesoría — EXPERT',
  robots: 'noindex, nofollow',
};

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name, tenant_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'tenant_admin') {
    // Redirect staff to admin, clients to their dashboard
    redirect(
      profile?.role === 'admin' || profile?.role === 'owner' ? '/admin' : '/dashboard'
    );
  }

  if (!profile.tenant_id) {
    // tenant_admin without a tenant — misconfigured, send to login
    redirect('/auth/login?error=no_tenant');
  }

  const tenant = await getTenantForUser(user.id);
  const settings = (tenant?.settings ?? {}) as Record<string, string>;
  const tenantName = settings.brand_name || tenant?.name || 'Mi asesoría';
  const brandColor = settings.primary_color || '#d7a33a';

  return (
    <div className="flex min-h-screen bg-[#f8f4eb]">
      <TenantSidebar
        tenantName={tenantName}
        brandColor={brandColor}
        userName={profile.full_name ?? user.email?.split('@')[0] ?? 'Usuario'}
        userEmail={user.email ?? ''}
      />
      <div className="flex min-w-0 flex-1 flex-col pt-[53px] pb-20 lg:pt-0 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
