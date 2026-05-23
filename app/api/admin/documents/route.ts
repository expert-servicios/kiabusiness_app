import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const source   = searchParams.get('source');
  const clientId = searchParams.get('client_id');
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));
  const limit    = 50;

  let query = admin
    .from('document_classifications')
    .select(`
      id, source, detected_type, detected_subtype, confidence, status,
      extracted_data, created_at, updated_at,
      client:profiles!client_id(id, full_name, email),
      case:cases!case_id(id, service)
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (status)   query = query.eq('status', status);
  if (source)   query = query.eq('source', source);
  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ documents: data ?? [] });
}
