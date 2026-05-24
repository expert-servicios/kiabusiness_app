import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { registerProfitabilityEvent } from '@/lib/profitability/register-event';
import { generateCaseSnapshot } from '@/lib/profitability/generate-snapshot';
import { canTransition } from '@/lib/cases/case-status';
import type { CaseStatus } from '@/lib/cases/case-status';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [caseResult, docsResult] = await Promise.all([
      admin
        .from('cases')
        .select('id,category,service,state,opened_at,closed_at,client_id,admin_note,docs_checklist')
        .eq('id', id)
        .single(),
      admin.from('documents').select('id,original_name,state,created_at,file_path').eq('case_id', id).order('created_at', { ascending: false })
    ]);

    if (caseResult.error || !caseResult.data) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const caseData = caseResult.data;

    // Fetch client info
    const [authUser, clientProfile] = await Promise.all([
      admin.auth.admin.getUserById(caseData.client_id),
      admin.from('profiles').select('full_name,phone').eq('id', caseData.client_id).single()
    ]);

    // Generate signed download URLs (1h validity)
    const docs = await Promise.all(
      (docsResult.data ?? []).map(async (doc) => {
        const { data: urlData } = await admin.storage
          .from('client-documents')
          .createSignedUrl(doc.file_path, 3600);
        return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
      })
    );

    return NextResponse.json({
      case: {
        ...caseData,
        client: {
          email: authUser.data.user?.email ?? '',
          full_name: clientProfile.data?.full_name ?? null,
          phone: clientProfile.data?.phone ?? null
        }
      },
      documents: docs
    });
  } catch (err) {
    console.error('[admin/cases/[id] GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json() as {
      status?: CaseStatus;
      priority?: string;
      admin_note?: string;
      next_action?: string;
      due_date?: string;
    };

    // Validate status transition if status is being updated
    if (body.status) {
      const { data: current } = await admin
        .from('cases').select('status, service_id, client_id').eq('id', id).single();

      if (!current) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

      const fromStatus = (current.status ?? 'nuevo') as CaseStatus;
      if (fromStatus !== body.status && !canTransition(fromStatus, body.status)) {
        return NextResponse.json(
          { error: `Transición no permitida: ${fromStatus} → ${body.status}` },
          { status: 422 }
        );
      }

      // Update case
      const updatePayload: Record<string, unknown> = { status: body.status };
      if (body.priority)    updatePayload.priority    = body.priority;
      if (body.admin_note !== undefined) updatePayload.admin_note  = body.admin_note;
      if (body.next_action !== undefined) updatePayload.next_action = body.next_action;
      if (body.due_date !== undefined)   updatePayload.due_date    = body.due_date;
      if (body.status === 'finalizado')  updatePayload.closed_at   = new Date().toISOString();

      const { error: updateErr } = await admin.from('cases').update(updatePayload).eq('id', id);
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      // Register profitability event (fire-and-forget)
      const serviceId = current.service_id ?? 'unknown';
      const clientId  = current.client_id  ?? undefined;
      void registerProfitabilityEvent({
        caseId:    id,
        clientId,
        serviceId,
        eventType: 'case_status_changed',
        source:    'manual',
        operator:  'admin',
        metadata:  { from: fromStatus, to: body.status, changed_by: user.id },
      }).catch(() => {});

      // On finalizado: generate case-level profitability snapshot
      if (body.status === 'finalizado') {
        void generateCaseSnapshot(id).catch(() => {});
      }

      return NextResponse.json({ ok: true, status: body.status });
    }

    // Non-status fields update (note, next_action, due_date)
    const updatePayload: Record<string, unknown> = {};
    if (body.priority)    updatePayload.priority    = body.priority;
    if (body.admin_note !== undefined) updatePayload.admin_note  = body.admin_note;
    if (body.next_action !== undefined) updatePayload.next_action = body.next_action;
    if (body.due_date !== undefined)   updatePayload.due_date    = body.due_date;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    const { error: updateErr } = await admin.from('cases').update(updatePayload).eq('id', id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/cases/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
