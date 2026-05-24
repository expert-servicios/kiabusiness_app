import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { getKiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    return NextResponse.json(await getKiaHealthSummary());
  } catch (error) {
    console.error('[GET /api/admin/kia/health]', error);
    return NextResponse.json({ error: 'No se pudo cargar Kia Health' }, { status: 500 });
  }
}
