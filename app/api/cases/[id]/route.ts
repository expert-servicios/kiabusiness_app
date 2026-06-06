import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import {
  serviceCompleted,
  reviewRequest,
  caseOpened,
  caseDocsRequired,
  caseDocsReceived,
  caseInProgress,
  casePendingExternal,
  caseResolutionReceived,
  caseDelivered
} from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';

const ALL_STATES = [
  // New 8-stage flow
  'nuevo',
  'docs_pendientes',
  'docs_recibidos',
  'en_tramitacion',
  'pendiente_externo',
  'resolucion_recibida',
  'entregado',
  'finalizado',
  // Legacy states (backward compat)
  'pendiente_documentacion',
  'en_revision',
  'en_proceso',
  'presentado'
] as const;

const caseUpdateSchema = z.object({
  state: z.enum(ALL_STATES).optional(),
  note: z.string().max(1000).optional(),
  organism: z.string().max(200).optional(),
  docs: z.array(z.string()).optional(),
  admin_note: z.string().max(2000).optional(),
  docs_checklist: z.array(z.string()).optional()
});

async function resolveClientInfo(clientId: string): Promise<{ email: string; name: string } | null> {
  const adminSupabase = getSupabaseAdmin();
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(clientId);
  const email = authUser?.user?.email;
  if (!email) return null;

  const { data: profile } = await adminSupabase
    .from('profiles').select('full_name').eq('id', clientId).single();

  return { email, name: profile?.full_name ?? email.split('@')[0] };
}

async function sendStageEmail(
  state: string,
  clientEmail: string,
  clientName: string,
  service: string,
  note: string | null,
  organism?: string,
  docs?: string[]
) {
  const fact = getRandomFunFact();

  const stateEmailMap: Record<string, () => Promise<void>> = {
    nuevo: async () => {
      const tpl = caseOpened(clientName, service, note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.opened', ...tpl });
    },
    docs_pendientes: async () => {
      const tpl = caseDocsRequired(clientName, service, docs ?? [], note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.docs_required', ...tpl });
    },
    docs_recibidos: async () => {
      const tpl = caseDocsReceived(clientName, service, note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.docs_received', ...tpl });
    },
    en_tramitacion: async () => {
      const tpl = caseInProgress(clientName, service, note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.in_progress', ...tpl });
    },
    pendiente_externo: async () => {
      const tpl = casePendingExternal(clientName, service, organism ?? 'organismo competente', note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.pending_external', ...tpl });
    },
    resolucion_recibida: async () => {
      const tpl = caseResolutionReceived(clientName, service, note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.resolution_received', ...tpl });
    },
    entregado: async () => {
      const tpl = caseDelivered(clientName, service, note, fact);
      await sendEmail({ to: clientEmail, eventType: 'case.delivered', ...tpl });
    },
    finalizado: async () => {
      const completedTpl = serviceCompleted(clientName, service);
      await sendEmail({ to: clientEmail, eventType: 'service.completed', ...completedTpl });
      const reviewTpl = reviewRequest(clientName, service, '');
      await sendEmail({ to: clientEmail, eventType: 'review.request', ...reviewTpl });
    }
  };

  const handler = stateEmailMap[state];
  if (handler) await handler();
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();

    if (profileError || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = caseUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { state, note, organism, docs, admin_note, docs_checklist } = parseResult.data;

    if (!state && !admin_note && docs_checklist === undefined) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    const { data: currentCase, error: fetchError } = await adminSupabase
      .from('cases')
      .select('id,state,service,client_id,category')
      .eq('id', id)
      .single();

    if (fetchError || !currentCase) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (state) updatePayload.state = state;
    if (state === 'finalizado' || state === 'entregado') updatePayload.closed_at = new Date().toISOString();
    if (admin_note !== undefined) updatePayload.admin_note = admin_note;
    if (docs_checklist !== undefined) updatePayload.docs_checklist = docs_checklist;

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
      actor_id: user.id,
      action: 'case.updated',
      entity: 'cases',
      entity_id: id,
      metadata: {
        previous_state: currentCase.state,
        new_state: state ?? currentCase.state,
        note,
        organism
      }
    }).then(() => {});

    // Send email only if state changed
    if (state && state !== currentCase.state) {
      const clientInfo = await resolveClientInfo(currentCase.client_id);
      if (clientInfo) {
        await sendStageEmail(
          state,
          clientInfo.email,
          clientInfo.name,
          currentCase.service,
          note ?? null,
          organism,
          docs
        );
      }
    }

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Case PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
