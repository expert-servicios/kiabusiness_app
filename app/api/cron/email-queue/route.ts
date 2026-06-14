import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/email-queue';

// Vercel Cron — runs every hour (see vercel.json)
// Protected by CRON_SECRET. Fails closed: returns 500 if the secret is not configured.
export const maxDuration = 60; // seconds — required for batches up to ~20 emails

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('[cron/email-queue] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processEmailQueue(20);
    return NextResponse.json({ ok: true, ...result, processedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/email-queue]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
