import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? { admin, userId: user.id } : null;
}

const schema = z.object({
  client_id:      z.string().uuid().optional().nullable(),
  case_id:        z.string().uuid().optional().nullable(),
  amount_eur:     z.number().positive(),
  currency:       z.string().default('EUR'),
  payment_method: z.enum(['transferencia', 'efectivo', 'bizum', 'cheque', 'otro']).default('transferencia'),
  description:    z.string().min(1).max(300),
  paid_at:        z.string().datetime().optional(),
  reference:      z.string().max(120).optional().nullable(),
  notes:          z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { admin, userId } = ctx;
  const { data, error } = await admin
    .from('manual_payments')
    .insert({
      ...parsed.data,
      paid_at: parsed.data.paid_at ?? new Date().toISOString(),
      created_by: userId,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { admin } = ctx;
  const { data, error } = await admin
    .from('manual_payments')
    .select('*')
    .order('paid_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: data ?? [] });
}
