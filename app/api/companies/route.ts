import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const FORMA_JURIDICA = ['autonomo','sl','sa','slne','cb','cooperativa','fundacion','otra'] as const;

const companySchema = z.object({
  razon_social:     z.string().min(2).max(200),
  nombre_comercial: z.string().max(200).optional().nullable(),
  cif_nif:          z.string().max(20).optional().nullable(),
  forma_juridica:   z.enum(FORMA_JURIDICA),
  direccion:        z.string().max(300).optional().nullable(),
  ciudad:           z.string().max(100).optional().nullable(),
  provincia:        z.string().max(100).optional().nullable(),
  codigo_postal:    z.string().max(10).optional().nullable(),
  pais:             z.string().length(2).default('ES'),
  telefono:         z.string().max(25).optional().nullable(),
  email:            z.string().email().optional().nullable().or(z.literal('')).transform(v => v || null),
  web:              z.string().max(200).optional().nullable()
});

type CompanyMembershipRow = {
  role: string;
  company: Record<string, unknown> | Record<string, unknown>[] | null;
};

async function getUser(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/companies — list user's companies
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('profile_companies')
      .select('role, company:companies(*)')
      .eq('profile_id', user.id)
      .order('created_at', { referencedTable: 'companies', ascending: true });

    if (error) {
      console.error('[companies GET]', error);
      return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
    }

    const companies = ((data ?? []) as unknown as CompanyMembershipRow[])
      .map((row) => {
        const company = Array.isArray(row.company) ? row.company[0] : row.company;
        return company ? { ...company, role: row.role } : null;
      })
      .filter((company): company is Record<string, unknown> & { role: string } => company !== null);

    return NextResponse.json({ companies });
  } catch (err) {
    console.error('[companies GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/companies — create a company
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const parse = companySchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const d = parse.data;

    // Create company — map form field names to actual DB column names
    const { data: company, error: createError } = await admin
      .from('companies')
      .insert({
        razon_social:    d.razon_social,
        nombre_comercial:d.nombre_comercial,
        cif_nif:         d.cif_nif,
        forma_juridica:  d.forma_juridica,
        direccion:       d.direccion,
        ciudad:          d.ciudad,
        provincia:       d.provincia,
        codigo_postal:   d.codigo_postal,
        pais:            d.pais ?? 'ES',
        telefono:        d.telefono,
        email:           d.email,
        web:             d.web,
        created_by:      user.id,
      })
      .select('*')
      .single();

    if (createError || !company) {
      console.error('[companies POST] create', createError);
      return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
    }

    // Link profile as owner
    await admin.from('profile_companies').insert({
      profile_id: user.id,
      company_id: company.id,
      role: 'owner'
    });

    // Set as active company
    await admin
      .from('profiles')
      .update({ active_company_id: company.id })
      .eq('id', user.id);

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error('[companies POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
