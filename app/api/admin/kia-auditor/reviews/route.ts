import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url      = new URL(request.url);
  const status   = url.searchParams.get('status');
  const limit    = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
  const offset   = parseInt(url.searchParams.get('offset') ?? '0');
  const channel  = url.searchParams.get('channel');

  let query = admin
    .from('kia_auditor_reviews')
    .select('id,source_type,channel,overall_status,score,summary,findings,rules_passed,rules_failed,recommendations,acknowledged,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('overall_status', status);
  if (channel) query = query.eq('channel', channel);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [], total: count ?? 0 });
}
