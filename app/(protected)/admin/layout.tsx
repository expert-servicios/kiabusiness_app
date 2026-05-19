import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { createServerClient } from '@supabase/ssr';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

async function fetchJson(path: string, cookieHeader: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  // Read session directly from Supabase (avoids HTTP round-trip that can fail on cold starts)
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

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id,role,full_name,email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const enrichedProfile = { ...profile, email: profile?.email ?? user.email ?? '' };

  const obligationsData = await fetchJson(
    `/api/admin/fiscal-calendar?year=${new Date().getFullYear()}`,
    cookieHeader
  );

  // Count urgent (overdue or ≤7 days) pending obligations across all clients
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentCount = (obligationsData?.obligations ?? []).filter((o: { status: string; deadline: string }) => {
    if (o.status !== 'pending') return false;
    const diff = Math.ceil((new Date(o.deadline).getTime() - today.getTime()) / 86400000);
    return diff <= 7;
  }).length;

  return (
    <div className="flex min-h-screen bg-[#f8f4eb]">
      <AdminSidebar
        userName={enrichedProfile.full_name ?? null}
        userEmail={enrichedProfile.email}
        urgentCount={urgentCount}
      />
      <div className="flex min-w-0 flex-1 flex-col pt-[53px] pb-20 lg:pt-0 lg:pb-0">
        {children}
      </div>
      <AdminMobileNav urgentCount={urgentCount} />
    </div>
  );
}
