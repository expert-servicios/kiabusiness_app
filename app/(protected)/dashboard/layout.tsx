import { type ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { KiaCopilotPanel } from '@/components/dashboard/KiaCopilotPanel';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function fetchJson(path: string, cookieHeader: string) {
  try {
    const res = await fetch(absoluteAppUrl(path), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  // Read session directly — avoids HTTP round-trip failures on cold starts
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [profileRow, companiesData] = await Promise.all([
    getSupabaseAdmin()
      .from('profiles')
      .select('id,role,status,full_name,active_company_id')
      .eq('id', user.id)
      .single()
      .then((r) => r.data),
    fetchJson('/api/companies', cookieHeader)
  ]);

  const companies = companiesData?.companies ?? [];
  if (profileRow?.status === 'inactive') redirect('/auth/login?error=inactive');
  if (profileRow?.role === 'tenant_admin') redirect('/tenant/dashboard');

  return (
    <div className="flex min-h-screen">
      <DashboardNav
        companies={companies}
        activeCompanyId={profileRow?.active_company_id ?? null}
        userName={profileRow?.full_name ?? null}
        userEmail={user.email ?? ''}
        isAdmin={profileRow?.role === 'admin' || profileRow?.role === 'owner'}
      />
      {/* pt-[53px] offsets the fixed mobile top bar; lg:pt-0 removes it on desktop */}
      <div className="flex min-w-0 flex-1 flex-col pt-[53px] pb-20 lg:pt-0 lg:pb-0">
        {children}
      </div>
      <MobileNav />
      <KiaCopilotPanel />
    </div>
  );
}
