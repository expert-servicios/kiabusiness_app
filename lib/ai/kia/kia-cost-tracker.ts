// Model pricing (USD per 1M tokens) — approximate, update when pricing changes
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'claude-sonnet-4-6':         { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80,  outputPer1M: 4.00  },
  'claude-haiku-4-5':          { inputPer1M: 0.80,  outputPer1M: 4.00  },
  'claude-opus-4-8':           { inputPer1M: 15.00, outputPer1M: 75.00 },
  'gpt-4o':                    { inputPer1M: 5.00,  outputPer1M: 15.00 },
  'text-embedding-3-small':    { inputPer1M: 0.02,  outputPer1M: 0     },
};

export interface KiaTokenUsage {
  tokensIn: number;
  tokensOut: number;
}

export interface KiaCostEstimate extends KiaTokenUsage {
  estimatedCostUsd: number;
  model: string;
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): KiaCostEstimate {
  const pricing = MODEL_PRICING[model];
  const estimatedCostUsd = pricing
    ? (tokensIn * pricing.inputPer1M + tokensOut * pricing.outputPer1M) / 1_000_000
    : 0;
  return { model, tokensIn, tokensOut, estimatedCostUsd };
}

export function sumCostEstimates(estimates: KiaCostEstimate[]): KiaCostEstimate {
  if (!estimates.length) return { model: 'unknown', tokensIn: 0, tokensOut: 0, estimatedCostUsd: 0 };
  return {
    model: estimates.map((e) => e.model).join('+'),
    tokensIn: estimates.reduce((s, e) => s + e.tokensIn, 0),
    tokensOut: estimates.reduce((s, e) => s + e.tokensOut, 0),
    estimatedCostUsd: estimates.reduce((s, e) => s + e.estimatedCostUsd, 0),
  };
}

/**
 * Parses token usage from an Anthropic provider result payload.
 * The Anthropic API returns usage in result.usage.input_tokens / output_tokens.
 */
export function extractTokenUsageFromProviderResult(providerResult: unknown): KiaTokenUsage {
  if (!providerResult || typeof providerResult !== 'object') return { tokensIn: 0, tokensOut: 0 };
  const r = providerResult as Record<string, unknown>;
  const usage = r.usage as Record<string, unknown> | undefined;
  return {
    tokensIn:  typeof usage?.input_tokens  === 'number' ? usage.input_tokens  : 0,
    tokensOut: typeof usage?.output_tokens === 'number' ? usage.output_tokens : 0,
  };
}
