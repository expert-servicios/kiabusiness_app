import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

const templateSchema = z.object({
  name           : z.string().min(1).max(80),
  title          : z.string().min(3).max(200),
  description    : z.string().min(5),
  amount_eur     : z.number().positive().nullable().optional(),
  expires_in_days: z.number().int().min(1).max(90).default(14),
  docs_checklist : z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const admin = getSupabaseAdmin();
  const { data: templates, error } = await admin
    .from('quote_templates')
    .select('id, name, title, description, amount_eur, expires_in_days, docs_checklist, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: templates ?? [] });
}

export async function POST(request: NextRequest) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: template, error } = await admin
    .from('quote_templates')
    .insert({ ...parsed.data, created_by: actorId })
    .select('id, name, title, description, amount_eur, expires_in_days, docs_checklist, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template }, { status: 201 });
}
