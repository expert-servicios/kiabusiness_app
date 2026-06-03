import { cookies } from 'next/headers';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { SuscripcionesClient } from '@/components/admin/SuscripcionesClient';

interface Client { name: string | null; email: string; phone: string | null; whatsapp_number: string | null }
export interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  client_id: string | null;
  company_id: string | null;
  client: Client | null;
}

async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/subscriptions'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.subscriptions as Subscription[];
  } catch {
    return [];
  }
}

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getSubscriptions();
  return <SuscripcionesClient initialSubscriptions={subscriptions} />;
}
