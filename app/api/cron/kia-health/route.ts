import { NextRequest, NextResponse } from 'next/server';
import { runKiaHealthChecks } from '@/lib/ai/kia/health/kia-health-runner';
import { verifyCronRequest } from '@/lib/security/cron';

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/kia-health');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
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
