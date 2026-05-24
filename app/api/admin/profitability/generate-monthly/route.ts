import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { generateMonthlySnapshots } from '@/lib/profitability/generate-snapshot';

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { period?: string };
  const result = await generateMonthlySnapshots(body.period);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, services: result.services, period: body.period ?? new Date().toISOString().slice(0, 7) });
}
