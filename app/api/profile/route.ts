import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional()
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
      .select('id,role,full_name,phone,country,created_at')
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

    const { data: profile, error: updateError } = await getSupabaseAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', sessionData.session.user.id)
      .select('id,full_name,phone')
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
