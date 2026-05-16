import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

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

  const [profileData, obligationsData] = await Promise.all([
    fetchJson('/api/profile', cookieHeader),
    fetchJson(`/api/admin/fiscal-calendar?year=${new Date().getFullYear()}`, cookieHeader),
  ]);

  const profile = profileData?.profile ?? null;

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

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
        userName={profile?.full_name ?? null}
        userEmail={profile?.email ?? ''}
        urgentCount={urgentCount}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {children}
      </div>
      <AdminMobileNav urgentCount={urgentCount} />
    </div>
  );
}
