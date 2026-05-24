import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { fetchAuditorSummary, KIA_AUDITOR_RULES } from '@/lib/ai/kia-auditor/kia-auditor-engine';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const summary = await fetchAuditorSummary();
  const rules = KIA_AUDITOR_RULES.map((r) => ({
    id:          r.id,
    label:       r.label,
    category:    r.category,
    severity:    r.severity,
    description: r.description,
    evalType:    r.evaluationType,
  }));

  return NextResponse.json({ ...summary, rules });
}
