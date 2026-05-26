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

  let { data, error } = await query;
  if (isMissingColumnError(error)) {
    let legacyQuery = admin
      .from('kia_behavior_anomalies')
      .select('id, source, severity, anomaly_type, title, description, resolved, metadata, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') legacyQuery = legacyQuery.eq('resolved', status !== 'open');

    const legacy = await legacyQuery;
    data = (legacy.data ?? []).map((item: {
      id: string;
      source: string;
      severity: string;
      anomaly_type: string;
      title: string;
      description: string;
      resolved: boolean;
      metadata: Record<string, unknown>;
      created_at: string;
      resolved_at: string | null;
    }) => ({
      ...item,
      status: item.resolved ? 'fixed' : 'open',
      updated_at: item.resolved_at ?? item.created_at,
    }));
    error = legacy.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anomalies: data ?? [] });
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42703' || /column .* does not exist/i.test(error.message ?? '');
}
