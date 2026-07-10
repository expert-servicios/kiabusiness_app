import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/email-queue';
import { verifyCronRequest } from '@/lib/security/cron';

// Supabase pg_cron — runs every hour (see supabase/migrations/20260625000001_pgcron_email_queue.sql)
// Protected by CRON_SECRET. Fails closed: returns 500 if the secret is not configured.
export const maxDuration = 60; // seconds — required for batches up to ~20 emails

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/email-queue');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  try {
    const result = await processEmailQueue(20);
    if (result.error) {
      return NextResponse.json({ ok: false, ...result, processedAt: new Date().toISOString() }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ...result, processedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/email-queue]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
