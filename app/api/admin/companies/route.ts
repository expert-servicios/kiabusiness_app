import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

const LEGAL_FORMS = ['autonomo', 'sl', 'sa', 'slne', 'cb', 'cooperativa', 'fundacion', 'otra'] as const;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? { admin, userId: user.id } : null;
}

// GET /api/admin/companies — list all companies with member count
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const { admin } = auth;

    const { data, error } = await admin
      .from('companies')
      .select('id, razon_social, cif_nif, forma_juridica, direccion, ciudad, email, telefono, stripe_customer_id, status, created_at, profile_companies(profile_id)')
      .order('razon_social');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const companies = (data ?? []).map((c) => ({
      id:           c.id,
      razon_social: c.razon_social,
      cif_nif:      c.cif_nif,
      forma_juridica: c.forma_juridica,
      direccion:    c.direccion,
      ciudad:       c.ciudad,
      email:        c.email,
      phone:        c.telefono,
      stripe_customer_id: c.stripe_customer_id,
      status:       c.status ?? 'active',
      created_at:   c.created_at,
      memberCount:  Array.isArray(c.profile_companies) ? c.profile_companies.length : 0,
    }));

    return NextResponse.json({ companies });
  } catch (err) {
    console.error('[admin/companies GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const createSchema = z.object({
  razon_social:   z.string().min(1, 'Nombre requerido').max(200),
  cif_nif:        z.string().max(20).optional(),
  forma_juridica: z.enum(LEGAL_FORMS).optional(),
  email:          z.string().email().optional().or(z.literal('')),
  phone:          z.string().max(30).optional(),
  ciudad:         z.string().max(100).optional(),
  direccion:      z.string().max(300).optional(),
});

// POST /api/admin/companies — create a new company
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const { admin, userId } = auth;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { razon_social, cif_nif, forma_juridica, email, phone, ciudad, direccion } = parsed.data;

    const insert: Record<string, unknown> = {
      razon_social,
      status: 'active',
      created_by: userId,
    };
    if (cif_nif)        insert.cif_nif        = cif_nif;
    if (forma_juridica) insert.forma_juridica  = forma_juridica;
    if (email)          insert.email           = email;
    if (phone)          insert.telefono        = phone;
    if (ciudad)         insert.ciudad          = ciudad;
    if (direccion)      insert.direccion       = direccion;

    const { data, error } = await admin
      .from('companies')
      .insert(insert)
      .select('id, razon_social, cif_nif, forma_juridica, ciudad, email, telefono, status, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      company: data ? { ...data, phone: data.telefono } : data,
    }, { status: 201 });
  } catch (err) {
    console.error('[admin/companies POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
