import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { registerProfitabilityEvent } from '@/lib/profitability/register-event';
import { generateCaseSnapshot } from '@/lib/profitability/generate-snapshot';
import { canTransition } from '@/lib/cases/case-status';
import type { CaseStatus } from '@/lib/cases/case-status';
import { sendEmail } from '@/lib/email/send';
import { upsertCalendarEventSA, hasCalendarSA } from '@/lib/integrations/google-calendar';
import {
  caseDocsRequired,
  caseDocsReceived,
  caseInProgress,
  casePendingExternal,
  caseDelivered,
  reviewRequest,
} from '@/lib/email/templates';

// ── Automation settings helper ──────────────────────────────────────────────
// Returns set of enabled automation keys. Defaults to all enabled on error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEnabledAutomations(admin: any): Promise<Set<string> | null> {
  try {
    const { data } = await admin.from('automation_settings').select('key, enabled');
    if (!data) return null;
    const enabled = new Set<string>();
    for (const row of data as { key: string; enabled: boolean }[]) {
      if (row.enabled) enabled.add(row.key);
    }
    return enabled;
  } catch {
    return null; // table not yet migrated — treat all as enabled
  }
}

// ── Status → client email mapping ──────────────────────────────────────────
// Sends the appropriate template when admin transitions the case status.
// fire-and-forget: email failure never blocks the status update.
async function sendCaseStatusEmail(params: {
  newStatus: CaseStatus;
  clientEmail: string;
  clientName: string;
  clientId: string;
  service: string;
  adminNote: string | null;
  caseId: string;
  enabledAutomations: Set<string> | null;
}): Promise<void> {
  const { newStatus, clientEmail, clientName, clientId, service, adminNote, caseId, enabledAutomations } = params;
  const isEnabled = (key: string) => !enabledAutomations || enabledAutomations.has(key);
  const funFact = '';

  let tpl: { subject: string; html: string } | null = null;

  switch (newStatus) {
    case 'pendiente_cliente':
      if (!isEnabled('case.pendiente_cliente')) return;
      tpl = caseDocsRequired(clientName, service, [], adminNote, funFact);
      break;
    case 'en_revision':
      if (!isEnabled('case.en_revision')) return;
      tpl = caseDocsReceived(clientName, service, adminNote, funFact);
      break;
    case 'listo_para_presentar':
      if (!isEnabled('case.listo_para_presentar')) return;
      tpl = caseInProgress(clientName, service, adminNote, funFact);
      break;
    case 'presentado':
      if (!isEnabled('case.presentado')) return;
      tpl = casePendingExternal(clientName, service, null, adminNote, funFact);
      break;
    case 'finalizado': {
      // Generate review token (30-day expiry) — best-effort
      let reviewToken = '';
      try {
        reviewToken = randomBytes(32).toString('hex');
        const admin = getSupabaseAdmin();
        await admin.from('review_requests').insert({
          case_id: caseId,
          client_id: clientId,
          token: reviewToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch { reviewToken = ''; }

      if (isEnabled('case.finalizado')) {
        const deliveredTpl = caseDelivered(clientName, service, adminNote, funFact);
        void sendEmail({ to: clientEmail, eventType: 'case.delivered', ...deliveredTpl, metadata: { caseId } });
      }
      if (isEnabled('case.review_request') && reviewToken) {
        const reviewTpl = reviewRequest(clientName, service, reviewToken);
        void sendEmail({ to: clientEmail, eventType: 'case.review_request', ...reviewTpl, metadata: { caseId } });
      }
      return;
    }
    default:
      return;
  }

  if (tpl) {
    void sendEmail({ to: clientEmail, eventType: `case.${newStatus}`, ...tpl, metadata: { caseId } });
  }
}

// Fetch client email + name for a given userId
async function getClientInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
): Promise<{ email: string; name: string } | null> {
  const [authResult, profileResult] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from('profiles').select('full_name').eq('id', userId).single(),
  ]);
  const email = authResult.data?.user?.email;
  if (!email) return null;
  return { email, name: profileResult.data?.full_name ?? email.split('@')[0] };
}

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
      admin.from('documents').select('id,original_name,state,created_at,file_path,uploaded_by_role').eq('case_id', id).order('created_at', { ascending: false })
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
        .from('cases').select('status, service_id, client_id, service, admin_note').eq('id', id).single();

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

      // Send client notification email (fire-and-forget — never blocks the response)
      if (body.status !== fromStatus) {
        const [clientInfo, enabledAutomations] = await Promise.all([
          getClientInfo(admin, current.client_id),
          getEnabledAutomations(admin),
        ]);
        if (clientInfo) {
          void sendCaseStatusEmail({
            newStatus: body.status,
            clientEmail: clientInfo.email,
            clientName: clientInfo.name,
            clientId: current.client_id,
            service: current.service ?? 'Trámite EXPERT',
            adminNote: body.admin_note ?? null,
            caseId: id,
            enabledAutomations,
          }).catch((err) => console.error('[cases PATCH] email error:', err));
        }
      }

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

    const { data: updatedCase, error: updateErr } = await admin
      .from('cases')
      .update(updatePayload)
      .eq('id', id)
      .select('service, category, client_id, google_calendar_event_id')
      .single();
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Background: sync due_date to Google Calendar as a reminder
    if (body.due_date && hasCalendarSA() && updatedCase) {
      const dateOnly = body.due_date.slice(0, 10);
      const clientInfo = await getClientInfo(admin, updatedCase.client_id).catch(() => null);
      upsertCalendarEventSA(
        {
          summary: `⚠️ Vencimiento: ${updatedCase.service ?? updatedCase.category}`,
          description: clientInfo
            ? `Cliente: ${clientInfo.name} (${clientInfo.email})\nExpediente: ${id}`
            : `Expediente: ${id}`,
          date: dateOnly,
          reminderDaysBefore: [7, 1],
        },
        (updatedCase.google_calendar_event_id as string | null) ?? undefined
      ).then((eventId) => {
        if (eventId) {
          admin.from('cases').update({ google_calendar_event_id: eventId }).eq('id', id)
            .then(() => null, () => null);
        }
      }).catch((e) => console.error('[cases PATCH] calendar sync:', e));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/cases/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
