import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

async function getProfileRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile?.role ?? null;
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await getProfileRole();

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
