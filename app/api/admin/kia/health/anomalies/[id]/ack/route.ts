import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const now = new Date().toISOString();
  let { error } = await admin
    .from('kia_behavior_anomalies')
    .update({ status: 'acknowledged', updated_at: now })
    .eq('id', id);

  if (isMissingColumnError(error)) {
    const legacy = await admin
      .from('kia_behavior_anomalies')
      .update({ resolved: true, resolved_at: now })
      .eq('id', id);
    error = legacy.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42703' || /column .* does not exist/i.test(error.message ?? '');
}
