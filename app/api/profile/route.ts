import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const profileUpdateSchema = z.object({
  full_name:         z.string().min(2).max(100).optional(),
  phone:             z.string().max(20).optional(),
  whatsapp_number:   z.string().max(20).optional(),
  whatsapp_consent:  z.boolean().optional(),
  active_company_id: z.string().uuid().nullable().optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Envía al menos un campo' });

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile, error: fetchError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id,role,full_name,phone,whatsapp_number,whatsapp_consent,country,active_company_id,created_at')
      .eq('id', sessionData.session.user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ profile: { ...profile, email: sessionData.session.user.email } });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = profileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parseResult.data.full_name !== undefined) updates.full_name = parseResult.data.full_name;
    if (parseResult.data.phone !== undefined) updates.phone = parseResult.data.phone;
    if (parseResult.data.whatsapp_number !== undefined) updates.whatsapp_number = parseResult.data.whatsapp_number;
    if (parseResult.data.whatsapp_consent !== undefined) updates.whatsapp_consent = parseResult.data.whatsapp_consent;
    if (parseResult.data.active_company_id !== undefined) updates.active_company_id = parseResult.data.active_company_id;

    const { data: profile, error: updateError } = await getSupabaseAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', sessionData.session.user.id)
      .select('id,full_name,phone,whatsapp_number,whatsapp_consent')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
