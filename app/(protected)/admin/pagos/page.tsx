import { cookies } from 'next/headers';
import { PagosDashboard } from '@/components/admin/PagosDashboard';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import type { UnifiedPayment } from '@/app/api/admin/pagos/unified/route';

async function fetchUnified(cookieHeader: string) {
  try {
    const res = await fetch(absoluteAppUrl('/api/admin/pagos/unified'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return { payments: [], kpis: { totalCobrado: 0, pendingCount: 0, unlinkedCount: 0, total: 0 } };
    return res.json();
  } catch {
    return { payments: [], kpis: { totalCobrado: 0, pendingCount: 0, unlinkedCount: 0, total: 0 } };
  }
}

export default async function AdminPagosPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const { payments, kpis } = await fetchUnified(cookieHeader);

  return (
    <PagosDashboard
      initialPayments={payments as UnifiedPayment[]}
      initialKpis={kpis}
    />
  );
}
