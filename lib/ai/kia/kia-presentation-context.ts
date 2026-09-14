export const KIA_FISCAL_RISK_SEVERITIES = ['high', 'critical'] as const;
export type KiaFiscalRiskSeverity = (typeof KIA_FISCAL_RISK_SEVERITIES)[number];

/**
 * Bounded codes for presentation-only fiscal risk. These codes are intentionally
 * coarse: they describe an already-verified backend condition, not a conclusion
 * inferred from user wording or model prose.
 */
export const KIA_FISCAL_RISK_CODES = [
  'deadline_risk',
  'filing_overdue',
  'payment_overdue',
  'material_tax_anomaly',
] as const;
export type KiaFiscalRiskCode = (typeof KIA_FISCAL_RISK_CODES)[number];

export const KIA_FISCAL_RISK_SOURCES = ['readiness', 'viability', 'accounting', 'case', 'fiscal_calendar'] as const;
export type KiaFiscalRiskSource = (typeof KIA_FISCAL_RISK_SOURCES)[number];

export const KIA_ASSURANCE_KINDS = [
  'verified_data',
  'validated_status',
  'authoritative_source',
] as const;
export type KiaAssuranceKind = (typeof KIA_ASSURANCE_KINDS)[number];

export const KIA_ASSURANCE_SOURCES = ['profile', 'company', 'case', 'holded', 'official_source'] as const;
export type KiaAssuranceSource = (typeof KIA_ASSURANCE_SOURCES)[number];

export const KIA_MILESTONE_KINDS = [
  'filing_submitted',
  'case_completed',
  'payment_confirmed',
  'service_completed',
] as const;
export type KiaMilestoneKind = (typeof KIA_MILESTONE_KINDS)[number];

export const KIA_MILESTONE_SOURCES = ['filing', 'case', 'payment', 'service'] as const;
export type KiaMilestoneSource = (typeof KIA_MILESTONE_SOURCES)[number];

/**
 * Presentation-only context assembled by trusted server code.
 *
 * It is deliberately separate from KiaDecision so the language model does not
 * become the source of truth for fiscal alerts, assurance or celebration.
 * Browser input and arbitrary response text must never be mapped directly into
 * this object.
 */
export interface KiaPresentationContext {
  fiscalRisk?: {
    severity: KiaFiscalRiskSeverity;
    code: KiaFiscalRiskCode;
    source: KiaFiscalRiskSource;
  };
  assurance?: {
    kind: KiaAssuranceKind;
    source: KiaAssuranceSource;
  };
  milestone?: {
    kind: KiaMilestoneKind;
    source: KiaMilestoneSource;
  };
}
