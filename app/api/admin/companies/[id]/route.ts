import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

const patchSchema = z.object({
  razon_social:   z.string().min(1).max(200).optional(),
  cif_nif:        z.string().max(20).optional(),
  forma_juridica: z.string().max(50).optional(),
  email:          z.string().email().optional().or(z.literal('')),
  phone:          z.string().max(30).optional(),
  ciudad:         z.string().max(100).optional(),
  direccion:      z.string().max(300).optional(),
  status:         z.enum(['active', 'inactive']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) update[k] = v;
    }

    const { data, error } = await admin
      .from('companies')
      .update(update)
      .eq('id', id)
      .select('id, razon_social, cif_nif, forma_juridica, ciudad, email, phone, status')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, company: data });
  } catch (err) {
    console.error('[admin/companies PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;

    // Remove profile_companies links first
    await admin.from('profile_companies').delete().eq('company_id', id);

    // Clear active_company_id on any profiles pointing to this company
    await admin.from('profiles').update({ active_company_id: null }).eq('active_company_id', id);

    const { error } = await admin.from('companies').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/companies DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
