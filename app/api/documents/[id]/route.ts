import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    const { data: doc, error: docError } = await admin
      .from('documents')
      .select('id, file_path, client_id')
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (!isAdmin && doc.client_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (doc.file_path) {
      await admin.storage.from('client-documents').remove([doc.file_path]);
    }

    await admin.from('documents').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const docUpdateSchema = z.object({
  state: z.enum(['pendiente', 'revisado', 'rechazado'])
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = docUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data: doc, error: updateError } = await adminSupabase
      .from('documents')
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
