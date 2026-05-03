import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const caseUpdateSchema = z.object({
  state: z.enum(['pendiente_documentacion', 'en_revision', 'en_proceso', 'presentado', 'finalizado'])
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
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = caseUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message ?? 'Estado inválido' }, { status: 400 });
    }

    const { data: currentCase, error: fetchError } = await adminSupabase
      .from('cases')
      .select('id,state')
      .eq('id', id)
      .single();

    if (fetchError || !currentCase) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const newState = parseResult.data.state;
    const closedAt = newState === 'finalizado' ? new Date().toISOString() : null;

    const updatePayload: Record<string, unknown> = { state: newState };
    if (newState === 'finalizado') updatePayload.closed_at = closedAt;

    const { data: updatedCase, error: updateError } = await adminSupabase
      .from('cases')
      .update(updatePayload)
      .eq('id', id)
      .select('id,state,opened_at,closed_at,category,service,client_id')
      .single();

    if (updateError || !updatedCase) {
      console.error('Case update failed:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar el expediente' }, { status: 500 });
    }

    await adminSupabase.from('audit_logs').insert({
      actor_id: sessionData.session.user.id,
      action: 'case.state.updated',
      entity: 'cases',
      entity_id: id,
      metadata: { previous_state: currentCase.state, new_state: newState }
    });

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Case PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
