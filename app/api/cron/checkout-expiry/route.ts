import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { closeNba } from '@/lib/nba/create-nba';
import { verifyCronRequest } from '@/lib/security/cron';

// Vercel Cron: runs daily at 06:00 UTC, before the other daily crons.
// Protected by CRON_SECRET header (set in Vercel env vars).
//
// Safety net for stale `checkout_sessions` rows. Stripe's own
// checkout.session.expired webhook normally marks these 'expired', but a
// row can be left 'open' forever if that event is never delivered/matched
// (e.g. an admin-generated link the client never opened, or the client
// completed a *different* checkout session for the same plan instead).
// Left alone, a stale 'open' row keeps surfacing as a false "checkout
// abandonado" in both /admin/operaciones and the NBA queue even after the
// client is already active.
//
// This only touches `checkout_sessions.status` — a session-tracking field,
// not a financial record — and only for rows well past Stripe's default
// 24h checkout expiry, so it never contradicts what Stripe itself would
// report for that session.
const STALE_AFTER_HOURS = 48;

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/checkout-expiry');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  console.log(JSON.stringify({ cron: 'checkout-expiry', event: 'start', at: new Date().toISOString() }));

  const admin = getSupabaseAdmin();
  const staleBefore = new Date(Date.now() - STALE_AFTER_HOURS * 3_600_000).toISOString();

  const { data: staleSessions, error: fetchError } = await admin
    .from('checkout_sessions')
    .select('id, user_id')
    .not('status', 'in', '(completed,expired)')
    .lt('created_at', staleBefore)
    .limit(200);

  if (fetchError) {
    console.error('[cron/checkout-expiry] fetch failed:', fetchError.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  let expired = 0;
  for (const session of staleSessions ?? []) {
    const { error: updateError } = await admin
      .from('checkout_sessions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    if (updateError) {
      console.error('[cron/checkout-expiry] update failed for', session.id, updateError.message);
      continue;
    }
    expired++;

    if (session.user_id) {
      await closeNba({ action_type: 'checkout_abandonado', client_id: session.user_id });
    }
  }

  console.log(JSON.stringify({ cron: 'checkout-expiry', event: 'done', found: staleSessions?.length ?? 0, expired }));
  return NextResponse.json({ ok: true, found: staleSessions?.length ?? 0, expired });
}
