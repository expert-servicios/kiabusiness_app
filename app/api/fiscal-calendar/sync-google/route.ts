import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { upsertCalendarEvent, deleteCalendarEvent, type StoredTokens } from '@/lib/integrations/google-calendar';

// POST /api/fiscal-calendar/sync-google — sync user's pending obligations to Google Calendar
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Load tokens
  const { data: tokenRow } = await admin
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: 'Google Calendar no conectado' }, { status: 400 });
  }

  const tokens: StoredTokens = {
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expiry_date,
    scope: tokenRow.scope,
  };

  // Load pending obligations without a google_event_id
  const { data: obligations, error: oblError } = await admin
    .from('fiscal_obligations')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending'])
    .order('deadline');

  if (oblError) return NextResponse.json({ error: 'Error al obtener obligaciones' }, { status: 500 });

  let synced = 0;
  let failed = 0;

  for (const obl of obligations ?? []) {
    try {
      const eventId = await upsertCalendarEvent(
        tokens,
        {
          summary: `AEAT — Modelo ${obl.modelo}: ${obl.description}`,
          description: `Plazo: ${obl.deadline}\nEstado: ${obl.status}\nPeriodo: ${obl.period_label ?? ''}`,
          date: obl.deadline,
          reminderDaysBefore: [30, 7, 1],
        },
        obl.google_event_id
      );

      await admin
        .from('fiscal_obligations')
        .update({ google_event_id: eventId, updated_at: new Date().toISOString() })
        .eq('id', obl.id);

      synced++;
    } catch {
      failed++;
    }
  }

  // Refresh stored tokens if they changed
  await admin
    .from('google_tokens')
    .update({ updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true, synced, failed });
}

// DELETE /api/fiscal-calendar/sync-google — disconnect Google Calendar
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  const { data: tokenRow } = await admin
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (tokenRow) {
    const tokens: StoredTokens = {
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    };

    // Remove synced events from Google Calendar
    const { data: synced } = await admin
      .from('fiscal_obligations')
      .select('id,google_event_id')
      .eq('user_id', user.id)
      .not('google_event_id', 'is', null);

    for (const obl of synced ?? []) {
      if (obl.google_event_id) {
        await deleteCalendarEvent(tokens, obl.google_event_id).catch(() => null);
        await admin.from('fiscal_obligations').update({ google_event_id: null }).eq('id', obl.id);
      }
    }

    await admin.from('google_tokens').delete().eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
