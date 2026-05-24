import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { KIA_AUDITOR_RULES } from '@/lib/ai/kia-auditor/kia-auditor-rules';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: ruleResults } = await db
    .from('kia_auditor_rule_results')
    .select('rule_id, status')
    .gte('created_at', since);

  const countsByRule = new Map<string, { passed: number; failed: number; warning: number }>();
  for (const r of ruleResults ?? []) {
    const key = r.rule_id as string;
    const current = countsByRule.get(key) ?? { passed: 0, failed: 0, warning: 0 };
    if (r.status === 'passed') current.passed++;
    else if (r.status === 'failed') current.failed++;
    else if (r.status === 'warning') current.warning++;
    countsByRule.set(key, current);
  }

  const rules = KIA_AUDITOR_RULES.map((rule) => {
    const counts = countsByRule.get(rule.id) ?? { passed: 0, failed: 0, warning: 0 };
    const total  = counts.passed + counts.failed + counts.warning;
    const failRate = total > 0 ? Math.round((counts.failed / total) * 100) : null;
    return {
      id:          rule.id,
      label:       rule.label,
      category:    rule.category,
      severity:    rule.severity,
      description: rule.description,
      evalType:    rule.evaluationType,
      stats30d:    { ...counts, total, failRate },
    };
  });

  return NextResponse.json({ rules });
}
