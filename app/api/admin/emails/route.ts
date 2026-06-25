import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

// GET — list email events
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: events, error } = await admin
    .from('email_events')
    .select('id,event_type,recipient_email,subject,resend_id,status,last_error,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

// DELETE — borrar uno o varios registros
// Body: { ids: number[] }
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  let body: { ids?: number[] };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids requerido' }, { status: 400 });
  }

  const { error } = await admin.from('email_events').delete().in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted: ids.length });
}

// POST — reenviar un email fallido (requiere HTML almacenado en email_queue o regeneración)
// Body: { id: number }  — solo soportado para tipos cuyo HTML está en email_queue
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  let body: { id?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  if (!body?.id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { data: ev } = await admin
    .from('email_events')
    .select('id,event_type,recipient_email,subject,status,metadata')
    .eq('id', body.id)
    .single();

  if (!ev) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
  if (ev.status !== 'failed') return NextResponse.json({ error: 'Solo se pueden reenviar emails fallidos' }, { status: 400 });

  // Re-encolar: insertar en email_queue para que el cron lo procese.
  // Require that HTML be regenerated for supported types.
  const RESEND_SUPPORTED = ['new_client_admin_alert', 'client_invite_wa'];
  if (!RESEND_SUPPORTED.includes(ev.event_type)) {
    return NextResponse.json({
      error: 'Reenvío automático no disponible para este tipo. Triggea el flujo original.',
      eventType: ev.event_type,
    }, { status: 422 });
  }

  // Buscar HTML en email_queue si existe una entrada reciente similar
  const { data: queued } = await admin
    .from('email_queue')
    .select('html')
    .eq('to_email', ev.recipient_email)
    .eq('event_type', ev.event_type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!queued?.html) {
    return NextResponse.json({
      error: 'No se encontró el HTML original. Genera una nueva invitación desde la bandeja WABA.',
    }, { status: 422 });
  }

  const { error: qErr } = await admin.from('email_queue').insert({
    to_email: ev.recipient_email,
    subject: `[Reenvío] ${ev.subject}`,
    html: queued.html,
    event_type: ev.event_type,
    metadata: { resent_from_id: ev.id, ...(ev.metadata as object ?? {}) },
    status: 'pending',
  });

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  // Marcar el original como "retried"
  await admin.from('email_events').update({ status: 'retried' }).eq('id', ev.id).catch(() => null);

  return NextResponse.json({ ok: true, message: 'Email añadido a la cola de envío' });
}
