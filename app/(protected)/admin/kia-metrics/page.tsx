import { cookies } from 'next/headers';
import { KiaMetricsDashboard } from '@/components/admin/KiaMetricsDashboard';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function fetchMetrics() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/kia-metrics'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function KiaMetricsPage() {
  const data = await fetchMetrics();
  return <KiaMetricsDashboard initialData={data} />;
}
