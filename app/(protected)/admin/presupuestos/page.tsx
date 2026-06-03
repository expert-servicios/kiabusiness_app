import { cookies } from 'next/headers';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { AdminQuoteCard } from '@/components/quotes/AdminQuoteCard';
import { PresupuestosClient } from '@/components/admin/PresupuestosClient';

interface Quote {
  id: string;
  title: string;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  client_id: string | null;
}

async function getAdminQuotes(): Promise<Quote[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/quotes'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.quotes as Quote[];
  } catch {
    return [];
  }
}

export default async function AdminQuotesPage() {
  const quotes = await getAdminQuotes();

  return (
    <PresupuestosClient initialQuotes={quotes} />
  );
}
