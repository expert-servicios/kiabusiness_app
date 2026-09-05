import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, actorId: user.id };
}

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });
const renameSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80) });
const moveSchema = z.object({
  sourceKind: z.enum(['inbox_thread', 'sent_event']),
  provider: z.string().trim().min(1).max(40),
  sourceKey: z.string().trim().min(1).max(500),
  folderId: z.string().uuid().nullable(),
  clientId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  caseId: z.string().uuid().nullable().optional(),
});

function slugify(input: string) {
  const base = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return base || 'carpeta';
}

export async function GET(request: NextRequest) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { admin } = ctx;
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');

  if (folderId) {
    const parsedFolder = z.string().uuid().safeParse(folderId);
    if (!parsedFolder.success) return NextResponse.json({ error: 'ID de carpeta inválido' }, { status: 400 });

    const { data: folder } = await admin
      .from('admin_email_folders')
      .select('id,name,slug,system_key,is_system')
      .eq('id', folderId)
      .maybeSingle();
    if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });

    const { data: states, error: statesError } = await admin
      .from('admin_email_item_state')
      .select('folder_id,source_kind,provider,source_key,client_id,company_id,case_id,is_archived,updated_at')
      .eq('folder_id', folderId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    if (statesError) return NextResponse.json({ error: 'No se pudo cargar la carpeta' }, { status: 500 });

    const inboxStates = (states ?? []).filter((state) => state.source_kind === 'inbox_thread');
    const sentStates = (states ?? []).filter((state) => state.source_kind === 'sent_event');

    const inboxKeys = inboxStates.map((state) => state.source_key);
    const sentIds = sentStates
      .map((state) => Number(state.source_key))
      .filter((id) => Number.isInteger(id) && id > 0);

    const [inboxResult, sentResult] = await Promise.all([
      inboxKeys.length
        ? admin.from('email_inbox_cache')
          .select('thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id')
          .in('thread_id', inboxKeys)
        : Promise.resolve({ data: [], error: null }),
      sentIds.length
        ? admin.from('email_events')
          .select('id,event_type,recipient_email,subject,status,html,metadata,created_at')
          .in('id', sentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (inboxResult.error || sentResult.error) {
      return NextResponse.json({ error: 'No se pudieron cargar los correos de la carpeta' }, { status: 500 });
    }

    const inboxByKey = new Map((inboxResult.data ?? []).map((row) => [row.thread_id, row]));
    const sentById = new Map((sentResult.data ?? []).map((row) => [String(row.id), row]));

    const items = (states ?? []).map((state) => {
      if (state.source_kind === 'inbox_thread') {
        const row = inboxByKey.get(state.source_key);
        return {
          sourceKind: state.source_kind,
          provider: state.provider,
          sourceKey: state.source_key,
          clientId: state.client_id,
          companyId: state.company_id,
          caseId: state.case_id ?? row?.case_id ?? null,
          movedAt: state.updated_at,
          subject: row?.subject ?? '(Hilo no disponible en cache)',
          counterpart: row?.from_name ?? row?.from_email ?? '',
          email: row?.from_email ?? '',
          snippet: row?.snippet ?? '',
          date: row?.date ?? state.updated_at,
          unread: row?.unread ?? false,
          hasAttachment: row?.has_attachment ?? false,
          html: null,
          status: null,
        };
      }
      const row = sentById.get(state.source_key);
      return {
        sourceKind: state.source_kind,
        provider: state.provider,
        sourceKey: state.source_key,
        clientId: state.client_id,
        companyId: state.company_id,
        caseId: state.case_id,
        movedAt: state.updated_at,
        subject: row?.subject ?? '(Envío no disponible)',
        counterpart: row?.recipient_email ?? '',
        email: row?.recipient_email ?? '',
        snippet: '',
        date: row?.created_at ?? state.updated_at,
        unread: false,
        hasAttachment: false,
        html: row?.html ?? null,
        status: row?.status ?? null,
      };
    });

    return NextResponse.json({ folder, items });
  }

  const [foldersResult, statesResult, inboxResult, sentResult] = await Promise.all([
    admin.from('admin_email_folders')
      .select('id,name,slug,system_key,is_system,sort_order,created_at,updated_at')
      .order('sort_order', { ascending: true }).order('name', { ascending: true }),
    admin.from('admin_email_item_state')
      .select('folder_id,source_kind,provider,source_key,client_id,company_id,case_id,is_archived,updated_at'),
    admin.from('email_inbox_cache').select('thread_id', { count: 'exact', head: true }),
    admin.from('email_events').select('id', { count: 'exact', head: true }),
  ]);

  if (foldersResult.error || statesResult.error || inboxResult.error || sentResult.error) {
    console.error('[admin/correo/folders] read failed', foldersResult.error ?? statesResult.error ?? inboxResult.error ?? sentResult.error);
    return NextResponse.json({ error: 'No se pudieron cargar las carpetas' }, { status: 500 });
  }

  const folders = foldersResult.data ?? [];
  const states = statesResult.data ?? [];
  const customCounts = new Map<string, number>();
  const movedInbox = new Set<string>();
  const movedSent = new Set<string>();

  for (const state of states) {
    if (state.source_kind === 'inbox_thread') movedInbox.add(`${state.provider}:${state.source_key}`);
    if (state.source_kind === 'sent_event') movedSent.add(`${state.provider}:${state.source_key}`);
    if (state.folder_id && !state.is_archived) {
      customCounts.set(state.folder_id, (customCounts.get(state.folder_id) ?? 0) + 1);
    }
  }

  const inboxDefaultCount = Math.max(0, Number(inboxResult.count ?? 0) - movedInbox.size);
  const sentDefaultCount = Math.max(0, Number(sentResult.count ?? 0) - movedSent.size);

  return NextResponse.json({
    folders: folders.map((folder) => ({
      ...folder,
      count: folder.system_key === 'inbox'
        ? inboxDefaultCount
        : folder.system_key === 'sent'
          ? sentDefaultCount
          : customCounts.get(folder.id) ?? 0,
    })),
    states,
    sourceCounts: {
      inbox: Number(inboxResult.count ?? 0),
      sent: Number(sentResult.count ?? 0),
    },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { admin, actorId } = ctx;
  const body = await request.json();

  if (body.action === 'move') {
    const parsed = moveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    if (parsed.data.folderId) {
      const { data: folder } = await admin.from('admin_email_folders').select('id').eq('id', parsed.data.folderId).maybeSingle();
      if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }
    const { error } = await admin.from('admin_email_item_state').upsert({
      source_kind: parsed.data.sourceKind,
      provider: parsed.data.provider,
      source_key: parsed.data.sourceKey,
      folder_id: parsed.data.folderId,
      client_id: parsed.data.clientId ?? null,
      company_id: parsed.data.companyId ?? null,
      case_id: parsed.data.caseId ?? null,
      assigned_by: actorId,
      is_archived: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_kind,provider,source_key' });
    if (error) {
      console.error('[admin/correo/folders] move failed', error);
      return NextResponse.json({ error: 'No se pudo mover el correo' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Nombre de carpeta inválido' }, { status: 400 });

  const baseSlug = slugify(parsed.data.name);
  const { data: existing } = await admin.from('admin_email_folders').select('slug').ilike('slug', `${baseSlug}%`).limit(100);
  const used = new Set((existing ?? []).map((row) => row.slug));
  let slug = baseSlug;
  let n = 2;
  while (used.has(slug)) slug = `${baseSlug}-${n++}`;

  const { data: folder, error } = await admin.from('admin_email_folders')
    .insert({ name: parsed.data.name, slug, is_system: false, system_key: null, created_by: actorId })
    .select('id,name,slug,system_key,is_system,sort_order,created_at,updated_at').single();
  if (error) {
    console.error('[admin/correo/folders] create failed', error);
    return NextResponse.json({ error: 'No se pudo crear la carpeta' }, { status: 500 });
  }
  return NextResponse.json({ folder }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const parsed = renameSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { admin } = ctx;
  const { data: folder } = await admin.from('admin_email_folders').select('id,is_system').eq('id', parsed.data.id).maybeSingle();
  if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
  if (folder.is_system) return NextResponse.json({ error: 'Las carpetas del sistema no se pueden renombrar' }, { status: 409 });
  const { error } = await admin.from('admin_email_folders')
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id).eq('is_system', false);
  if (error) return NextResponse.json({ error: 'No se pudo renombrar la carpeta' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  const { admin } = ctx;
  const { data: folder } = await admin.from('admin_email_folders').select('id,is_system').eq('id', id).maybeSingle();
  if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
  if (folder.is_system) return NextResponse.json({ error: 'Las carpetas del sistema no se pueden eliminar' }, { status: 409 });
  const { error } = await admin.from('admin_email_folders').delete().eq('id', id).eq('is_system', false);
  if (error) return NextResponse.json({ error: 'No se pudo eliminar la carpeta' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
