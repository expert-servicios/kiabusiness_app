'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { KiaAuditorFindingCard } from './KiaAuditorFindingCard';

interface Review {
  id:            string;
  source_type:   string;
  channel:       string | null;
  overall_status: string;
  score:         number;
  summary:       string;
  findings:      Array<{ ruleId: string; severity: 'info' | 'warning' | 'critical'; explanation: string }>;
  recommendations: string[];
  acknowledged:  boolean;
  created_at:    string;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pass:    CheckCircle2,
  warning: AlertTriangle,
  fail:    XCircle,
};
const STATUS_COLOR: Record<string, string> = {
  pass:    'text-emerald-600',
  warning: 'text-amber-600',
  fail:    'text-red-600',
};

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'hace <1h';
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function ReviewRow({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const [acking, setAcking]    = useState(false);
  const [acked, setAcked]      = useState(review.acknowledged);
  const Icon  = STATUS_ICON[review.overall_status] ?? AlertTriangle;

  async function acknowledge() {
    setAcking(true);
    await fetch(`/api/admin/kia-auditor/reviews/${review.id}/ack`, { method: 'POST' });
    setAcked(true);
    setAcking(false);
  }

  return (
    <div className={`border-b border-[#f0e9da] last:border-0 ${acked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 px-5 py-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${STATUS_COLOR[review.overall_status] ?? ''}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#07111d]">{review.score}/100</span>
            <span className="text-xs text-[#29384a]/60">{review.source_type}</span>
            {review.channel && <span className="text-xs text-[#29384a]/60">· {review.channel}</span>}
            <span className="text-xs text-[#29384a]/40">{timeAgo(review.created_at)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[#29384a] line-clamp-2">{review.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!acked && review.overall_status !== 'pass' && (
            <button
              onClick={acknowledge}
              disabled={acking}
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#29384a] border border-[#d8cbb5] hover:border-[#c88b25] transition disabled:opacity-40"
            >
              {acking ? '…' : 'ACK'}
            </button>
          )}
          {review.findings.length > 0 && (
            <button onClick={() => setExpanded((v) => !v)} className="text-[#29384a]/40 hover:text-[#29384a]">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && review.findings.length > 0 && (
        <div className="space-y-1.5 px-5 pb-3">
          {review.findings.map((f, i) => (
            <KiaAuditorFindingCard key={i} finding={f} />
          ))}
          {review.recommendations.length > 0 && (
            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Recomendaciones</p>
              {review.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-blue-800">→ {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KiaAuditorReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 text-sm font-semibold text-[#29384a]">Sin revisiones recientes</p>
        <p className="mt-1 text-xs text-[#29384a]/60">Ejecuta una auditoría para ver resultados aquí.</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white overflow-hidden">
      <div className="border-b border-[#d8cbb5] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Revisiones recientes</p>
      </div>
      {reviews.map((r) => <ReviewRow key={r.id} review={r} />)}
    </section>
  );
}
