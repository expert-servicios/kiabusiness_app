import type { KiaDecision } from '../kia-output-schema';

export type KiaHealthCategory = 'technical' | 'behavioral' | 'business' | 'security' | 'cost' | 'latency';
export type KiaHealthStatus = 'passed' | 'failed' | 'warning' | 'skipped';
export type KiaHealthSeverity = 'info' | 'warning' | 'critical';
export type KiaHealthRunType = 'canary' | 'nightly_eval' | 'manual' | 'post_deploy' | 'incident_check';
export type KiaHealthRunStatus = 'success' | 'warning' | 'failed';
export type KiaHealthInputChannel = 'waba' | 'admin' | 'dashboard';
export type KiaHealthContactStatus = 'lead' | 'client' | 'unknown';

export interface KiaHealthExpected {
  intent?: string;
  intentAny?: string[];
  nextAction?: string;
  nextActionAny?: string[];
  mustContain?: string[];
  mustNotContain?: string[];
  mustNotSet?: string[];
  requiresManualReview?: boolean;
  requiresMeeting?: boolean;
  rulesApplied?: string[];
  contactStatus?: KiaHealthContactStatus;
  language?: 'es' | 'ru';
  forbidsApiKeyRequest?: boolean;
  mustNotEchoSecrets?: boolean;
  minConfidence?: number;
}

export interface KiaHealthCheck {
  id: string;
  category: KiaHealthCategory;
  severity: KiaHealthSeverity;
  title: string;
  input?: {
    channel: KiaHealthInputChannel;
    contactStatus: KiaHealthContactStatus;
    message: string;
    context?: Record<string, unknown>;
  };
  expected: KiaHealthExpected;
}

export interface KiaHealthCheckResult {
  checkId: string;
  category: KiaHealthCategory;
  severity: KiaHealthSeverity;
  status: KiaHealthStatus;
  title: string;
  inputMessage?: string;
  expected?: KiaHealthExpected;
  actual?: Record<string, unknown>;
  provider?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  costEstimate?: number | null;
  error?: string | null;
  decision?: KiaDecision;
}

export interface KiaHealthRunResult {
  id?: string;
  runType: KiaHealthRunType;
  status: KiaHealthRunStatus;
  score: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  provider?: string | null;
  model?: string | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: string;
  results: KiaHealthCheckResult[];
  metadata?: Record<string, unknown>;
}

export type KiaAnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type KiaAnomalyType =
  | 'invalid_json'
  | 'wrong_intent'
  | 'wrong_flow'
  | 'forbidden_checkout'
  | 'api_key_leak_risk'
  | 'hallucination_risk'
  | 'wrong_language'
  | 'excessive_needs_review'
  | 'tool_schema_error'
  | 'latency_spike'
  | 'provider_failure'
  | 'unsafe_accounting_action'
  | 'tax_presentation_claim'
  | 'repeated_answer_loop'
  | 'auditor_rule_failure';

export interface KiaBehaviorAnomalyInput {
  source: 'canary' | 'production' | 'admin_review' | 'eval';
  severity: KiaAnomalySeverity;
  anomalyType: KiaAnomalyType;
  title: string;
  description: string;
  relatedDecisionLogId?: string | null;
  relatedConversationId?: string | null;
  metadata?: Record<string, unknown>;
}
