import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const FORMA_JURIDICA = ['autonomo','sl','sa','slne','cb','cooperativa','fundacion','otra'] as const;

const companySchema = z.object({
  razon_social: z.string().min(2).max(200),
  nombre_comercial: z.string().max(200).optional().nullable(),
  cif_nif: z.string().max(20).optional().nullable(),
  forma_juridica: z.enum(FORMA_JURIDICA),
  direccion: z.string().max(300).optional().nullable(),
  ciudad: z.string().max(100).optional().nullable(),
  provincia: z.string().max(100).optional().nullable(),
  codigo_postal: z.string().max(10).optional().nullable(),
  pais: z.string().length(2).default('ES'),
  telefono: z.string().max(25).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')).transform(v => v || null),
  web: z.string().max(200).optional().nullable()
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

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const parse = companySchema.safeParse(await request.json());
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const d = parse.data;
    const normalizedTaxId = d.cif_nif?.trim().toUpperCase() || null;

    if (normalizedTaxId) {
      const { data: ownedRows, error: ownedError } = await admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', user.id);
      if (ownedError) {
        return NextResponse.json({ error: 'No se pudieron comprobar tus entidades actuales' }, { status: 500 });
      }
      const ownedIds = new Set((ownedRows ?? []).map((row) => row.company_id).filter(Boolean));

      const { data: matches, error: duplicateError } = await admin
        .from('companies')
        .select('id,razon_social,cif_nif')
        .eq('cif_nif', normalizedTaxId)
        .limit(10);
      if (duplicateError) {
        return NextResponse.json({ error: 'No se pudo verificar el CIF/NIF' }, { status: 500 });
      }

      const ownMatch = (matches ?? []).find((row) => ownedIds.has(row.id));
      if (ownMatch) {
        return NextResponse.json({ error: 'Ya tienes una entidad con este CIF/NIF', code: 'tax_id_duplicate' }, { status: 409 });
      }

      if ((matches ?? []).length > 0) {
        return NextResponse.json({
          error: 'Ya existe una entidad con este CIF/NIF vinculada a otra cuenta. Revisión manual necesaria.',
          code: 'tax_id_conflict',
          existingCompanyIds: (matches ?? []).map((row) => row.id)
        }, { status: 409 });
      }
    }

    const { data: company, error: createError } = await admin
      .from('companies')
      .insert({
        user_id: user.id,
        name: d.razon_social,
        company_name: d.razon_social,
        razon_social: d.razon_social,
        nombre_comercial: d.nombre_comercial,
        cif_nif: normalizedTaxId,
        vat_id: normalizedTaxId,
        forma_juridica: d.forma_juridica,
        direccion: d.direccion,
        address: d.direccion,
        ciudad: d.ciudad,
        city: d.ciudad,
        provincia: d.provincia,
        codigo_postal: d.codigo_postal,
        pais: d.pais ?? 'ES',
        country: d.pais ?? 'ES',
        telefono: d.telefono,
        phone: d.telefono,
        email: d.email,
        web: d.web,
        status: 'active',
      })
      .select('*')
      .single();

    if (createError || !company) {
      console.error('[companies POST] create', createError);
      return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
    }

    const { error: membershipError } = await admin.from('profile_companies').insert({
      profile_id: user.id,
      company_id: company.id,
      role: 'owner'
    });

    if (membershipError) {
      console.error('[companies POST] membership', membershipError);
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo vincular la nueva entidad; no se ha conservado el alta parcial.' }, { status: 500 });
    }

    const { error: activateError } = await admin
      .from('profiles')
      .update({ active_company_id: company.id })
      .eq('id', user.id);

    if (activateError) {
      console.error('[companies POST] active company', activateError);
      await admin.from('profile_companies').delete().eq('profile_id', user.id).eq('company_id', company.id);
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo activar la nueva entidad; no se ha conservado el alta parcial.' }, { status: 500 });
    }

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error('[companies POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
