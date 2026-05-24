import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'open';
  const limit = Math.min(Number(searchParams.get('limit') ?? '50') || 50, 100);

  let query = admin
    .from('kia_behavior_anomalies')
    .select('id, source, severity, anomaly_type, title, description, status, metadata, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anomalies: data ?? [] });
}
