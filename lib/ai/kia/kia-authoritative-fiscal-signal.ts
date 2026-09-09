import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { AEAT_VERIFIED_CALENDAR_YEAR, urgencyLevel } from '@/lib/utils/fiscal-calendar';
import type { KiaDecision } from './kia-output-schema';
import type { KiaPresentationContext } from './kia-presentation-context';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaAuthoritativeFiscalSignal {
  risk: NonNullable<KiaPresentationContext['fiscalRisk']>;
  obligation: {
    id: string;
    modelo: string;
    description: string;
    periodLabel: string | null;
    deadline: string;
  };
}

const FISCAL_CONTEXT_PATTERNS = [
  /\bfiscal(?:es)?\b/i,
  /\btribut(?:ario|aria|arios|arias|o|os)\b/i,
  /\bimpuesto(?:s)?\b/i,
  /\biva\b/i,
  /\birpf\b/i,
  /\bmodelo\s*(?:303|111|115|130|202|200|390|347|190|180)\b/i,
  /\b(?:303|111|115|130|202|200|390|347|190|180)\b/i,
  /\bvenc(?:e|er|imiento|imientos)\b/i,
  /\bplazo(?:s)?\b/i,
  /\bdeclaraci[oó]n(?:es)?\b/i,
];

const FISCAL_CONTEXT_INTENTS = new Set<KiaDecision['intent']>([
  'accounting_summary',
  'anomaly_review',
]);

/**
 * User wording is used only as a retrieval gate. It never creates a fiscal
 * warning by itself: the actual risk must come from a company-scoped,
 * Admin-confirmed fiscal obligation stored in the backend.
 */
export function shouldLoadKiaFiscalSignal(input: {
  message: string;
  currentPage?: string | null;
  intent: KiaDecision['intent'];
}): boolean {
  if (input.currentPage?.includes('/calendario-fiscal')) return true;
  if (FISCAL_CONTEXT_INTENTS.has(input.intent)) return true;
  return FISCAL_CONTEXT_PATTERNS.some((pattern) => pattern.test(input.message));
}

export async function loadKiaAuthoritativeFiscalSignal(
  admin: AdminClient,
  userId: string,
  companyId: string | null,
): Promise<KiaAuthoritativeFiscalSignal | null> {
  if (!companyId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  try {
    const { data, error } = await admin
      .from('fiscal_obligations')
      .select('id,modelo,description,period_label,deadline,status')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .lte('deadline', horizon)
      .order('deadline', { ascending: true })
      .limit(20);

    if (error) {
      console.error('[KiaCopilot] fiscal signal lookup failed:', error.message);
      return null;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      modelo: string;
      description: string;
      period_label: string | null;
      deadline: string;
      status: string;
    }>;

    const eligible = rows.filter((row) => {
      const deadlineYear = Number(row.deadline.slice(0, 4));
      return Number.isFinite(deadlineYear) && deadlineYear <= AEAT_VERIFIED_CALENDAR_YEAR;
    });

    const row = eligible.find((item) => urgencyLevel(item.deadline) === 'overdue')
      ?? eligible.find((item) => urgencyLevel(item.deadline) === 'critical');
    if (!row) return null;

    const urgency = urgencyLevel(row.deadline);
    return {
      risk: {
        severity: urgency === 'overdue' ? 'critical' : 'high',
        code: urgency === 'overdue' ? 'filing_overdue' : 'deadline_risk',
        source: 'fiscal_calendar',
      },
      obligation: {
        id: row.id,
        modelo: row.modelo,
        description: row.description,
        periodLabel: row.period_label,
        deadline: row.deadline,
      },
    };
  } catch (error) {
    console.error('[KiaCopilot] fiscal signal lookup exception:', error);
    return null;
  }
}

export function appendKiaFiscalNotice(
  reply: string,
  signal: KiaAuthoritativeFiscalSignal | null,
): string {
  if (!signal) return reply;

  const { obligation, risk } = signal;
  const period = obligation.periodLabel ? ` · ${obligation.periodLabel}` : '';
  const statusText = risk.code === 'filing_overdue'
    ? `figura pendiente y su vencimiento fue el ${obligation.deadline}`
    : `figura pendiente y vence el ${obligation.deadline}`;

  return `${reply}\n\nAviso fiscal verificado: modelo ${obligation.modelo}${period} ${statusText}.`;
}
