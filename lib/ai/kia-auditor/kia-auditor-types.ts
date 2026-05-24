export type AuditorSourceType =
  | 'decision_log'
  | 'conversation'
  | 'message'
  | 'health_check'
  | 'manual'
  | 'post_deploy';

export type AuditorOverallStatus = 'pass' | 'warning' | 'fail';

export type AuditorRuleCategory =
  | 'safety'
  | 'privacy'
  | 'business_flow'
  | 'checkout'
  | 'holded'
  | 'tax'
  | 'accounting'
  | 'language'
  | 'tone'
  | 'consistency'
  | 'tool_use';

export type AuditorRuleSeverity = 'info' | 'warning' | 'critical';
export type AuditorRuleStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export interface AuditorFinding {
  ruleId: string;
  severity: AuditorRuleSeverity;
  explanation: string;
}

export interface AuditorRuleDefinition {
  id: string;
  label: string;
  category: AuditorRuleCategory;
  severity: AuditorRuleSeverity;
  description: string;
  evaluationType: 'deterministic' | 'llm_judge' | 'human';
}

export interface AuditorRuleResult {
  ruleId: string;
  category: AuditorRuleCategory;
  severity: AuditorRuleSeverity;
  status: AuditorRuleStatus;
  expected?: string;
  actual?: string;
  explanation?: string;
}

export interface KiaAuditorReview {
  id?: string;
  sourceType: AuditorSourceType;
  sourceId?: string;
  conversationId?: string;
  decisionLogId?: string;
  clientId?: string;
  leadId?: string;
  caseId?: string;
  channel?: string;
  overallStatus: AuditorOverallStatus;
  score: number;
  summary: string;
  findings: AuditorFinding[];
  rulesPassed: string[];
  rulesFailed: string[];
  recommendations: string[];
  reviewerProvider?: string;
  reviewerModel?: string;
}

export interface AuditMessageInput {
  message: string;
  kiaResponse: string;
  decisionJson?: Record<string, unknown>;
  channel?: string;
  contactStatus?: 'lead' | 'client' | 'unknown';
  context?: Record<string, unknown>;
}

export interface LlmJudgeOutput {
  status: AuditorOverallStatus;
  score: number;
  summary: string;
  findings: AuditorFinding[];
  recommendations: string[];
}
