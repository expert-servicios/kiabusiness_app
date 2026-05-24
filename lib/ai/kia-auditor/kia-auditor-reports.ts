import type { KiaAuditorReview } from './kia-auditor-types';
import { KIA_AUDITOR_RULES_BY_ID } from './kia-auditor-rules';

export function formatReviewAsText(review: KiaAuditorReview): string {
  const icon = review.overallStatus === 'pass' ? '✅' : review.overallStatus === 'warning' ? '⚠️' : '❌';
  const lines: string[] = [
    `${icon} Kia Auditor — ${review.overallStatus.toUpperCase()} (score: ${review.score}/100)`,
    `Canal: ${review.channel ?? 'desconocido'} | Tipo: ${review.sourceType}`,
    ``,
    `Resumen: ${review.summary}`,
    ``,
  ];

  if (review.findings.length > 0) {
    lines.push('Hallazgos:');
    for (const f of review.findings) {
      const ruleDef = KIA_AUDITOR_RULES_BY_ID.get(f.ruleId);
      lines.push(`  [${f.severity.toUpperCase()}] ${ruleDef?.label ?? f.ruleId}: ${f.explanation}`);
    }
    lines.push('');
  }

  if (review.recommendations.length > 0) {
    lines.push('Recomendaciones:');
    for (const r of review.recommendations) {
      lines.push(`  → ${r}`);
    }
  }

  return lines.join('\n');
}

export function classifyBatchResults(reviews: KiaAuditorReview[]): {
  pass:    KiaAuditorReview[];
  warning: KiaAuditorReview[];
  fail:    KiaAuditorReview[];
  avgScore: number;
} {
  const pass    = reviews.filter((r) => r.overallStatus === 'pass');
  const warning = reviews.filter((r) => r.overallStatus === 'warning');
  const fail    = reviews.filter((r) => r.overallStatus === 'fail');
  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length)
    : 100;
  return { pass, warning, fail, avgScore };
}
