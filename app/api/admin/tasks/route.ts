import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return { admin, actorId: user.id };
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');

  let query = auth.admin
    .from('internal_tasks')
    .select('id,title,description,status,priority,assigned_to,case_id,client_id,lead_id,due_date,source,created_at,updated_at,completed_at')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (clientId) query = query.eq('client_id', clientId);

  const { data: tasks, error } = await query;
  if (error) return NextResponse.json({ error: 'No se pudieron cargar las tareas' }, { status: 500 });

  const clientIds = [...new Set((tasks ?? []).map((task) => task.client_id).filter(Boolean))] as string[];
  const caseIds = [...new Set((tasks ?? []).map((task) => task.case_id).filter(Boolean))] as string[];
  const [profilesRes, casesRes] = await Promise.all([
    clientIds.length
      ? auth.admin.from('profiles').select('id,full_name').in('id', clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    caseIds.length
      ? auth.admin.from('cases').select('id,service,state,status').in('id', caseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; service: string; state: string; status: string }> }),
  ]);
  const profileMap = new Map((profilesRes.data ?? []).map((item) => [item.id, item]));
  const caseMap = new Map((casesRes.data ?? []).map((item) => [item.id, item]));

  return NextResponse.json({
    tasks: (tasks ?? []).map((task) => ({
      ...task,
      client: task.client_id ? profileMap.get(task.client_id) ?? null : null,
      case: task.case_id ? caseMap.get(task.case_id) ?? null : null,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(['baja', 'media', 'alta', 'critica']).default('media'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const { data, error } = await auth.admin.from('internal_tasks').insert({
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    status: 'pendiente',
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate ?? null,
    client_id: parsed.data.clientId ?? null,
    case_id: parsed.data.caseId ?? null,
    assigned_to: auth.actorId,
    source: 'manual',
  }).select('id').single();
  if (error || !data) return NextResponse.json({ error: 'No se pudo crear la tarea' }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await auth.admin.from('internal_tasks').update({
    status: parsed.data.status,
    completed_at: parsed.data.status === 'completada' ? now : null,
    updated_at: now,
  }).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'No se pudo actualizar la tarea' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
