import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/email-queue';

// Vercel Cron — runs every hour (see vercel.json)
// Protected by CRON_SECRET (same header as other cron jobs)

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await processEmailQueue(50);
    return NextResponse.json({ ok: true, ...result, processedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/email-queue]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
