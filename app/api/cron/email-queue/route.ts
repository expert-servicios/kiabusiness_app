import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/email-queue';
import { verifyCronRequest } from '@/lib/security/cron';

// Vercel Cron — runs every hour (see vercel.json)
// Protected by CRON_SECRET. Fails closed: returns 500 if the secret is not configured.
export const maxDuration = 60; // seconds — required for batches up to ~20 emails

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/email-queue');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  const startedAt = new Date().toISOString();
  console.log(JSON.stringify({ cron: 'email-queue', event: 'start', at: startedAt }));

  try {
    const result = await processEmailQueue(20);
    console.log(JSON.stringify({ cron: 'email-queue', event: 'done', ...result, at: new Date().toISOString() }));
    return NextResponse.json({ ok: true, ...result, processedAt: startedAt });
  } catch (err) {
    console.error('[cron/email-queue]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
