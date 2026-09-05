import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import { deleteCalendarEventSA, hasCalendarSA, upsertCalendarEventSA } from '@/lib/integrations/google-calendar';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return { admin, userId: user.id };
}

const createSchema = z.object({
  companyId: z.string().uuid(),
  kind: z.string().trim().min(2).max(120),
  modelCode: z.string().trim().max(30).optional().nullable(),
  title: z.string().trim().min(2).max(180),
  periodKey: z.string().trim().max(40).optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(2000).optional().nullable(),
  syncCalendar: z.boolean().optional().default(true),
});

const patchSchema = z.object({
  obligationId: z.string().uuid(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
  kind: z.string().trim().min(2).max(120).optional(),
  modelCode: z.string().trim().max(30).optional().nullable(),
  title: z.string().trim().min(2).max(180).optional(),
  periodKey: z.string().trim().max(40).optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  syncCalendar: z.boolean().optional().default(true),
});

async function linkedCompany(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string, companyId: string) {
  const { data } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .eq('company_id', companyId)
    .maybeSingle();
  return Boolean(data);
}

function calendarSummary(row: { model_code?: string | null; title?: string | null; kind: string }) {
  const model = row.model_code?.trim();
  return model ? `Fiscal · Modelo ${model} · ${row.title || row.kind}` : `Fiscal · ${row.title || row.kind}`;
}

async function syncCalendar(row: {
  id: string;
  model_code: string | null;
  title: string | null;
  kind: string;
  period_key: string | null;
  due_date: string;
  notes: string | null;
  google_event_id: string | null;
  status: string | null;
}) {
  if (!hasCalendarSA()) return row.google_event_id;
  if (row.status === 'completed' || row.status === 'cancelled') {
    if (row.google_event_id) await deleteCalendarEventSA(row.google_event_id);
    return null;
  }
  return upsertCalendarEventSA({
    summary: calendarSummary(row),
    description: [row.period_key ? `Periodo: ${row.period_key}` : null, row.notes, `EXPERT obligation ${row.id}`].filter(Boolean).join('\n'),
    date: row.due_date,
    reminderDaysBefore: [10, 5, 1],
  }, row.google_event_id ?? undefined);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: clientId } = await params;

  const { data, error } = await auth.admin
    .from('obligations_calendar')
    .select('id,client_id,company_id,kind,model_code,title,period_key,due_date,status,notes,task_id,google_event_id,source,created_at,updated_at,completed_at')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ obligations: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: clientId } = await params;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  if (!(await linkedCompany(auth.admin, clientId, parsed.data.companyId))) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const { data: created, error } = await auth.admin
    .from('obligations_calendar')
    .insert({
      client_id: clientId,
      company_id: parsed.data.companyId,
      kind: parsed.data.kind,
      model_code: parsed.data.modelCode || null,
      title: parsed.data.title,
      period_key: parsed.data.periodKey || null,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes || null,
      status: 'planned',
      source: 'manual',
      created_by: auth.userId,
      metadata: { confirmed_by_admin: true },
    })
    .select('id,client_id,company_id,kind,model_code,title,period_key,due_date,status,notes,task_id,google_event_id,source,created_at,updated_at,completed_at')
    .single();

  if (error || !created) {
    if (error?.code === '23505') return NextResponse.json({ error: 'Ya existe esta obligación para la entidad, modelo, periodo y fecha' }, { status: 409 });
    return NextResponse.json({ error: error?.message ?? 'No se pudo crear la obligación' }, { status: 500 });
  }

  if (parsed.data.syncCalendar) {
    const eventId = await syncCalendar(created);
    if (eventId !== created.google_event_id) {
      await auth.admin.from('obligations_calendar').update({ google_event_id: eventId }).eq('id', created.id);
      created.google_event_id = eventId;
    }
  }

  return NextResponse.json({ obligation: created }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: clientId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const { data: existing } = await auth.admin
    .from('obligations_calendar')
    .select('id,client_id,company_id,kind,model_code,title,period_key,due_date,status,notes,task_id,google_event_id,source,created_at,updated_at,completed_at')
    .eq('id', parsed.data.obligationId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Obligación no encontrada' }, { status: 404 });
  if (!(await linkedCompany(auth.admin, clientId, existing.company_id))) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 409 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.kind !== undefined) update.kind = parsed.data.kind;
  if (parsed.data.modelCode !== undefined) update.model_code = parsed.data.modelCode || null;
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.periodKey !== undefined) update.period_key = parsed.data.periodKey || null;
  if (parsed.data.dueDate !== undefined) update.due_date = parsed.data.dueDate;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes || null;

  const { data: changed, error } = await auth.admin
    .from('obligations_calendar')
    .update(update)
    .eq('id', existing.id)
    .eq('client_id', clientId)
    .select('id,client_id,company_id,kind,model_code,title,period_key,due_date,status,notes,task_id,google_event_id,source,created_at,updated_at,completed_at')
    .single();
  if (error || !changed) return NextResponse.json({ error: error?.message ?? 'No se pudo actualizar la obligación' }, { status: 500 });

  if (parsed.data.syncCalendar) {
    const eventId = await syncCalendar(changed);
    if (eventId !== changed.google_event_id) {
      await auth.admin.from('obligations_calendar').update({ google_event_id: eventId }).eq('id', changed.id);
      changed.google_event_id = eventId;
    }
  }

  return NextResponse.json({ obligation: changed });
}
