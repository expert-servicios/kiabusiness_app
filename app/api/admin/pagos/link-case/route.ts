import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

const schema = z.object({
  orderId:   z.string().uuid(),
  caseId:    z.string().uuid().nullable(),
  origin:    z.enum(['stripe_order', 'manual']),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { orderId, caseId, origin } = parsed.data;
  const table = origin === 'manual' ? 'manual_payments' : 'orders';

  const { error } = await admin
    .from(table)
    .update({ case_id: caseId })
    .eq('id', orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
