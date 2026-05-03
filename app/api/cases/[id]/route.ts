import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { caseStatusUpdated, serviceCompleted, reviewRequest } from '@/lib/email/templates';

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
      .select('id,state,service,client_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentCase) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const newState = parseResult.data.state;
    const updatePayload: Record<string, unknown> = { state: newState };
    if (newState === 'finalizado') updatePayload.closed_at = new Date().toISOString();

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

    // ── Email notifications ────────────────────────────────────────────────
    if (newState !== currentCase.state) {
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(currentCase.client_id);
      const clientEmail = authUser?.user?.email;

      const { data: clientProfile } = await adminSupabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentCase.client_id)
        .single();

      const clientName = clientProfile?.full_name ?? clientEmail?.split('@')[0] ?? 'Cliente';
      const service = currentCase.service;

      if (clientEmail) {
        if (newState === 'finalizado') {
          // Service completed email
          const completedTpl = serviceCompleted(clientName, service);
          await sendEmail({
            to: clientEmail,
            eventType: 'service.completed',
            ...completedTpl,
            metadata: { case_id: id }
          });

          // Review request email (separate send, after a brief logical delay)
          const reviewTpl = reviewRequest(clientName, service);
          await sendEmail({
            to: clientEmail,
            eventType: 'review.request',
            ...reviewTpl,
            metadata: { case_id: id }
          });
        } else {
          // Status update email for all other state changes
          const statusTpl = caseStatusUpdated(clientName, service, newState);
          await sendEmail({
            to: clientEmail,
            eventType: 'case.status.updated',
            ...statusTpl,
            metadata: { case_id: id, new_state: newState }
          });
        }
      }
    }

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Case PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
