import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { citaConfirmed } from '@/lib/email/templates';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = admin
      .from('appointments')
      .select('id,name,email,phone,service,preferred_date,preferred_time,notes,status,confirmed_date,confirmed_time,meeting_url,admin_notes,created_at')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[admin/citas] GET:', error);
      return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
    }

    return NextResponse.json({ appointments: data ?? [] });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const updateSchema = z.object({
  status:         z.enum(['pending', 'confirmed', 'cancelled', 'rescheduled']).optional(),
  confirmed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  confirmed_time: z.string().max(60).optional().nullable(),
  meeting_url:    z.string().url().optional().nullable(),
  admin_notes:    z.string().max(1000).optional().nullable(),
  send_confirmation: z.boolean().optional()
});

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { send_confirmation, ...fields } = parsed.data;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
    };

    const { data: appt, error } = await admin
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select('id,name,email,service,confirmed_date,confirmed_time,meeting_url,status')
      .single();

    if (error || !appt) {
      console.error('[admin/citas] PATCH:', error);
      return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
    }

    // Send confirmation email if requested and status is confirmed
    if (send_confirmation && appt.status === 'confirmed' && appt.confirmed_date && appt.confirmed_time) {
      const confirmedDateFormatted = new Date(appt.confirmed_date + 'T12:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      await sendEmail({
        to: appt.email as string,
        eventType: 'cita.confirmed',
        ...citaConfirmed(
          appt.name as string,
          appt.service as string,
          confirmedDateFormatted,
          appt.confirmed_time as string,
          appt.meeting_url as string | null
        ),
        metadata: { appointment_id: appt.id }
      }).catch((e) => console.error('[cita] confirmation email failed:', e));
    }

    return NextResponse.json({ appointment: appt });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await admin.from('appointments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
