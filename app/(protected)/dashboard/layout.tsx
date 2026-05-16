import { type ReactNode } from 'react';
import { cookies } from 'next/headers';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { MobileNav } from '@/components/dashboard/MobileNav';

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

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const [profileData, companiesData] = await Promise.all([
    fetchJson('/api/profile', cookieHeader),
    fetchJson('/api/companies', cookieHeader)
  ]);

  const profile = profileData?.profile ?? null;
  const companies = companiesData?.companies ?? [];

  return (
    <>
      <DashboardNav
        companies={companies}
        activeCompanyId={profile?.active_company_id ?? null}
        userName={profile?.full_name ?? null}
        userEmail={profile?.email ?? ''}
        isAdmin={profile?.role === 'admin'}
      />
      <div className="pb-20 lg:pb-0">
        {children}
      </div>
      <MobileNav isAdmin={profile?.role === 'admin'} />
    </>
  );
}
