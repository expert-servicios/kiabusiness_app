import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const docUpdateSchema = z.object({
  state: z.enum(['pendiente', 'revisado', 'rechazado'])
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await sessionSupabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', sessionData.session.user.id).single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = docUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data: doc, error: updateError } = await adminSupabase
      .from('case_documents')
      .update({ state: parseResult.data.state })
      .eq('id', id)
      .select('id,original_name,state,case_id,client_id')
      .single();

    if (updateError || !doc) {
      return NextResponse.json({ error: 'No se pudo actualizar el documento' }, { status: 500 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Document PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
