import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import {
  FISCAL_TEMPLATE_CATALOG,
  FISCAL_TEMPLATE_CODES,
  generateFiscalTemplateObligations,
  getFiscalTemplate,
  type FiscalTemplateCode,
} from '@/lib/utils/fiscal-calendar';
import { hasCalendarSA, upsertCalendarEventSA } from '@/lib/integrations/google-calendar';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return { admin, actorId: user.id };
}

async function ensureLinkedCompany(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string, companyId: string) {
  const { data } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .eq('company_id', companyId)
    .maybeSingle();
  return Boolean(data);
}

const postSchema = z.object({
  companyId: z.string().uuid(),
  templateCode: z.enum(FISCAL_TEMPLATE_CODES),
  action: z.enum(['activate', 'deactivate', 'generate']),
  taxYear: z.number().int().min(2020).max(2100).optional(),
  includePast: z.boolean().optional().default(false),
  syncCalendar: z.boolean().optional().default(true),
  notes: z.string().trim().max(2000).optional().nullable(),
});

async function syncOperationalCalendar(row: {
  id: string;
  model_code: string | null;
  title: string | null;
  kind: string;
  period_key: string | null;
  due_date: string;
  notes: string | null;
  google_event_id: string | null;
}) {
  if (!hasCalendarSA()) return row.google_event_id;
  return upsertCalendarEventSA({
    summary: `Fiscal · Modelo ${row.model_code ?? ''} · ${row.title || row.kind}`.replace('Modelo  · ', ''),
    description: [row.period_key ? `Periodo: ${row.period_key}` : null, row.notes, `EXPERT obligation ${row.id}`].filter(Boolean).join('\n'),
    date: row.due_date,
    reminderDaysBefore: [10, 5, 1],
  }, row.google_event_id ?? undefined);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: clientId } = await params;
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  let query = auth.admin
    .from('company_fiscal_templates')
    .select('id,client_id,company_id,template_code,status,effective_from,effective_to,notes,created_at,updated_at')
    .eq('client_id', clientId)
    .order('template_code');
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: FISCAL_TEMPLATE_CATALOG, activations: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: clientId } = await params;
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const { companyId, templateCode, action } = parsed.data;
  if (!(await ensureLinkedCompany(auth.admin, clientId, companyId))) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const definition = getFiscalTemplate(templateCode);
  if (!definition) return NextResponse.json({ error: 'Plantilla fiscal no reconocida' }, { status: 400 });

  if (action === 'activate') {
    const { data: existing } = await auth.admin
      .from('company_fiscal_templates')
      .select('id,status')
      .eq('client_id', clientId)
      .eq('company_id', companyId)
      .eq('template_code', templateCode)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) return NextResponse.json({ ok: true, activationId: existing.id, alreadyActive: true });

    const { data: activation, error } = await auth.admin
      .from('company_fiscal_templates')
      .insert({
        client_id: clientId,
        company_id: companyId,
        template_code: templateCode,
        status: 'active',
        notes: parsed.data.notes || null,
        created_by: auth.actorId,
      })
      .select('id')
      .single();
    if (error || !activation) return NextResponse.json({ error: error?.message ?? 'No se pudo activar la plantilla' }, { status: 500 });
    return NextResponse.json({ ok: true, activationId: activation.id }, { status: 201 });
  }

  if (action === 'deactivate') {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await auth.admin
      .from('company_fiscal_templates')
      .update({ status: 'inactive', effective_to: today, updated_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('company_id', companyId)
      .eq('template_code', templateCode)
      .eq('status', 'active');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data: active } = await auth.admin
    .from('company_fiscal_templates')
    .select('id')
    .eq('client_id', clientId)
    .eq('company_id', companyId)
    .eq('template_code', templateCode)
    .eq('status', 'active')
    .maybeSingle();
  if (!active) return NextResponse.json({ error: 'Confirma y activa esta plantilla antes de generar vencimientos' }, { status: 409 });

  const taxYear = parsed.data.taxYear ?? new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const generated = generateFiscalTemplateObligations([templateCode as FiscalTemplateCode], taxYear)
    .filter((item) => parsed.data.includePast || item.deadline >= today);

  let createdFiscal = 0;
  let createdOperational = 0;
  const calendarErrors: string[] = [];

  for (const item of generated) {
    const { data: existingFiscal } = await auth.admin
      .from('fiscal_obligations')
      .select('id,obligations_calendar_id')
      .eq('user_id', clientId)
      .eq('company_id', companyId)
      .eq('year', taxYear)
      .eq('obligation_key', item.obligation_key)
      .maybeSingle();

    let fiscalId = existingFiscal?.id ?? null;
    let operationalId = existingFiscal?.obligations_calendar_id ?? null;

    if (!fiscalId) {
      const { data: fiscal, error: fiscalError } = await auth.admin
        .from('fiscal_obligations')
        .insert({
          user_id: clientId,
          company_id: companyId,
          year: taxYear,
          obligation_key: item.obligation_key,
          template_code: templateCode,
          modelo: item.modelo,
          description: item.description,
          period_label: item.period_label,
          deadline: item.deadline,
          status: 'pending',
          notes: item.deadline_verified ? null : 'Fecha nominal generada; revisar calendario AEAT publicado del ejercicio antes de presentar.',
        })
        .select('id')
        .single();
      if (fiscalError || !fiscal) return NextResponse.json({ error: fiscalError?.message ?? 'No se pudo crear el vencimiento fiscal' }, { status: 500 });
      fiscalId = fiscal.id;
      createdFiscal += 1;
    }

    if (!operationalId) {
      const { data: existingOperational } = await auth.admin
        .from('obligations_calendar')
        .select('id,google_event_id')
        .eq('company_id', companyId)
        .eq('model_code', item.modelo)
        .eq('period_key', item.period_label)
        .eq('due_date', item.deadline)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (existingOperational) {
        operationalId = existingOperational.id;
      } else {
        const { data: operational, error: operationalError } = await auth.admin
          .from('obligations_calendar')
          .insert({
            client_id: clientId,
            company_id: companyId,
            kind: 'Declaración fiscal',
            model_code: item.modelo,
            title: definition.title,
            period_key: item.period_label,
            due_date: item.deadline,
            notes: item.deadline_verified ? definition.warning : `${definition.warning}\nFecha nominal pendiente de verificar con el calendario AEAT publicado.`,
            status: 'planned',
            source: 'system',
            created_by: auth.actorId,
            metadata: {
              confirmed_by_admin: true,
              fiscal_template_code: templateCode,
              fiscal_obligation_id: fiscalId,
              deadline_verified: item.deadline_verified,
            },
          })
          .select('id,model_code,title,kind,period_key,due_date,notes,google_event_id')
          .single();
        if (operationalError || !operational) return NextResponse.json({ error: operationalError?.message ?? 'No se pudo crear el seguimiento operativo' }, { status: 500 });
        operationalId = operational.id;
        createdOperational += 1;

        if (parsed.data.syncCalendar) {
          const eventId = await syncOperationalCalendar(operational);
          if (eventId) {
            const { error: calendarPersistError } = await auth.admin.from('obligations_calendar').update({ google_event_id: eventId }).eq('id', operational.id);
            if (calendarPersistError) calendarErrors.push(operational.id);
          }
        }
      }
    }

    if (operationalId) {
      const { error: linkError } = await auth.admin
        .from('fiscal_obligations')
        .update({ obligations_calendar_id: operationalId, template_code: templateCode })
        .eq('id', fiscalId!);
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    template: definition,
    taxYear,
    generated: generated.length,
    createdFiscal,
    createdOperational,
    calendarSynced: parsed.data.syncCalendar && calendarErrors.length === 0,
    calendarErrors: calendarErrors.length,
  });
}
