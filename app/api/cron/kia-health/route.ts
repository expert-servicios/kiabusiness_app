import { NextRequest, NextResponse } from 'next/server';
import { runKiaHealthChecks } from '@/lib/ai/kia/health/kia-health-runner';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error('[cron/kia-health] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.KIA_HEALTH_CANARY_ENABLED?.toLowerCase() === 'false') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'KIA_HEALTH_CANARY_ENABLED=false' });
  }

  const result = await runKiaHealthChecks({
    runType: process.env.KIA_HEALTH_NIGHTLY_ENABLED?.toLowerCase() === 'true' ? 'nightly_eval' : 'canary',
    persist: true,
  });

  return NextResponse.json({ ok: true, result });
}
