import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getKiaProviderOrder } from '../kia-provider-router';
import type { KiaHealthCheckResult } from './kia-health-types';

export async function runKiaTechnicalChecks(): Promise<KiaHealthCheckResult[]> {
  const checks: KiaHealthCheckResult[] = [];
  checks.push(await checkSupabase());
  checks.push(await checkProviderConfig());
  checks.push(await checkAnthropicStatus());
  checks.push(await checkOpenAiStatus());
  checks.push(checkEnvPresence('waba_config_present', 'technical', 'critical', 'WABA config presente', [
    'META_WHATSAPP_ACCESS_TOKEN',
    'META_WHATSAPP_PHONE_NUMBER_ID',
    'META_APP_SECRET',
  ]));
  checks.push(checkEnvPresence('stripe_config_present', 'technical', 'critical', 'Stripe config presente', [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]));
  checks.push(checkEnvPresence('secret_encryption_configured', 'security', 'critical', 'Cifrado de secretos configurado', [
    'SECRET_ENCRYPTION_KEY',
  ]));
  checks.push(checkDecisionLogsFlag());
  checks.push(checkFeatureFlagCoherence());
  checks.push(await checkHoldedMcpBridge());
  return checks;
}

export async function runKiaBusinessChecks(): Promise<KiaHealthCheckResult[]> {
  const admin = getSupabaseAdmin();
  const results: KiaHealthCheckResult[] = [];

  const [{ count: pendingMessages }, { count: criticalNbas }, { count: recentRuns }] = await Promise.all([
    admin
      .from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .eq('needs_review', true),
    admin
      .from('next_best_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .eq('priority', 'critica'),
    admin
      .from('kia_health_runs')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  results.push({
    checkId: 'business_pending_waba_messages',
    category: 'business',
    severity: 'warning',
    status: (pendingMessages ?? 0) > 10 ? 'warning' : 'passed',
    title: 'Mensajes WABA pendientes de revisión',
    actual: { pendingMessages: pendingMessages ?? 0 },
    error: (pendingMessages ?? 0) > 10 ? 'Más de 10 mensajes pendientes' : null,
  });

  results.push({
    checkId: 'business_critical_nbas',
    category: 'business',
    severity: 'warning',
    status: (criticalNbas ?? 0) > 5 ? 'warning' : 'passed',
    title: 'NBAs críticas abiertas',
    actual: { criticalNbas: criticalNbas ?? 0 },
    error: (criticalNbas ?? 0) > 5 ? 'Más de 5 next best actions críticas abiertas' : null,
  });

  results.push({
    checkId: 'business_health_runs_recent',
    category: 'business',
    severity: 'info',
    status: (recentRuns ?? 0) > 0 ? 'passed' : 'warning',
    title: 'Health ejecutado en últimas 24h',
    actual: { recentRuns: recentRuns ?? 0 },
    error: (recentRuns ?? 0) > 0 ? null : 'No hay health runs recientes',
  });

  return results;
}

async function checkSupabase(): Promise<KiaHealthCheckResult> {
  const started = Date.now();
  try {
    const { error } = await getSupabaseAdmin().from('profiles').select('id').limit(1);
    return technicalResult({
      checkId: 'supabase_available',
      title: 'Supabase responde',
      severity: 'critical',
      status: error ? 'failed' : 'passed',
      latencyMs: Date.now() - started,
      error: error?.message ?? null,
    });
  } catch (error) {
    return technicalResult({
      checkId: 'supabase_available',
      title: 'Supabase responde',
      severity: 'critical',
      status: 'failed',
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function checkAnthropicStatus(): Promise<KiaHealthCheckResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return technicalResult({
      checkId: 'anthropic_configured',
      title: 'Anthropic API key configurada',
      severity: 'warning',
      status: 'skipped',
      error: 'ANTHROPIC_API_KEY missing',
    });
  }
  return checkStatusEndpoint('anthropic_status', 'Anthropic status público', 'https://status.anthropic.com/api/v2/status.json');
}

async function checkOpenAiStatus(): Promise<KiaHealthCheckResult> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return technicalResult({
      checkId: 'openai_configured',
      title: 'OpenAI fallback configurado',
      severity: 'warning',
      status: 'skipped',
      error: 'OPENAI_API_KEY missing',
    });
  }
  return checkStatusEndpoint('openai_status', 'OpenAI status público', 'https://status.openai.com/api/v2/status.json');
}

async function checkStatusEndpoint(checkId: string, title: string, url: string): Promise<KiaHealthCheckResult> {
  const started = Date.now();
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    const indicator = typeof data?.status?.indicator === 'string' ? data.status.indicator : 'unknown';
    const ok = response.ok && ['none', 'minor', 'unknown'].includes(indicator);
    return technicalResult({
      checkId,
      title,
      severity: 'warning',
      status: ok ? 'passed' : 'warning',
      latencyMs: Date.now() - started,
      actual: { httpStatus: response.status, indicator },
      error: ok ? null : `Status indicator: ${indicator}`,
    });
  } catch (error) {
    return technicalResult({
      checkId,
      title,
      severity: 'warning',
      status: 'warning',
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function checkProviderConfig(): Promise<KiaHealthCheckResult> {
  const providers = getKiaProviderOrder();
  return technicalResult({
    checkId: 'provider_router_configured',
    title: 'Provider router configurado',
    severity: 'critical',
    status: providers.length > 0 ? 'passed' : 'failed',
    actual: { providers: providers.map((provider) => ({ provider: provider.provider, model: provider.model })) },
    provider: providers[0]?.provider ?? null,
    model: providers[0]?.model ?? null,
    error: providers.length > 0 ? null : 'No AI provider configured',
  });
}

function checkDecisionLogsFlag(): KiaHealthCheckResult {
  const enabled = process.env.KIA_AI_DECISION_LOGS_ENABLED?.toLowerCase() !== 'false';
  return technicalResult({
    checkId: 'decision_logs_enabled',
    title: 'Decision logs activos',
    severity: 'critical',
    status: enabled ? 'passed' : 'failed',
    actual: { KIA_AI_DECISION_LOGS_ENABLED: process.env.KIA_AI_DECISION_LOGS_ENABLED ?? '(default true)' },
    error: enabled ? null : 'Decision logs disabled',
  });
}

function featureFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function checkFeatureFlagCoherence(): KiaHealthCheckResult {
  const structured = featureFlag('KIA_STRUCTURED_AI_ENABLED', true);
  const router = featureFlag('KIA_AI_PROVIDER_ROUTER_ENABLED', true);
  const tools = process.env.KIA_AI_TOOLS_ENABLED?.toLowerCase() === 'true';
  const ok = !structured || router;
  const warning = tools && process.env.KIA_HEALTH_ALLOW_TOOLS_ENABLED_WARNING?.toLowerCase() !== 'false';
  return technicalResult({
    checkId: 'feature_flags_coherent',
    title: 'Feature flags coherentes',
    severity: 'warning',
    status: ok ? warning ? 'warning' : 'passed' : 'failed',
    actual: {
      KIA_STRUCTURED_AI_ENABLED: process.env.KIA_STRUCTURED_AI_ENABLED ?? null,
      KIA_AI_PROVIDER_ROUTER_ENABLED: process.env.KIA_AI_PROVIDER_ROUTER_ENABLED ?? null,
      KIA_AI_TOOLS_ENABLED: process.env.KIA_AI_TOOLS_ENABLED ?? null,
    },
    error: ok ? warning ? 'KIA_AI_TOOLS_ENABLED=true: revisar que no haya acciones críticas sin confirmación' : null : 'Structured AI enabled but provider router disabled',
  });
}

function checkEnvPresence(
  checkId: string,
  category: 'technical' | 'security',
  severity: 'warning' | 'critical',
  title: string,
  envNames: string[],
): KiaHealthCheckResult {
  const missing = envNames.filter((name) => !process.env[name]?.trim());
  return {
    checkId,
    category,
    severity,
    status: missing.length === 0 ? 'passed' : severity === 'critical' ? 'failed' : 'warning',
    title,
    expected: { mustContain: envNames },
    actual: { configured: envNames.filter((name) => process.env[name]?.trim()), missing },
    error: missing.length ? `Missing env vars: ${missing.join(', ')}` : null,
  };
}

function technicalResult(params: {
  checkId: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  latencyMs?: number;
  actual?: Record<string, unknown>;
  provider?: string | null;
  model?: string | null;
  error?: string | null;
}): KiaHealthCheckResult {
  return {
    checkId: params.checkId,
    title: params.title,
    category: 'technical',
    severity: params.severity,
    status: params.status,
    actual: params.actual ?? {},
    provider: params.provider,
    model: params.model,
    latencyMs: params.latencyMs,
    error: params.error ?? null,
  };
}

async function checkHoldedMcpBridge(): Promise<KiaHealthCheckResult> {
  const hasSharedSecret = !!process.env.HOLDED_MCP_SHARED_SECRET?.trim();
  const mcpBaseUrl      = process.env.NEXT_PUBLIC_HOLDED_MCP_BASE_URL?.trim();
  const hasBaseUrl      = !!mcpBaseUrl;

  if (!hasSharedSecret || !hasBaseUrl) {
    return {
      checkId : 'holded_mcp_bridge_config',
      title   : 'Holded MCP bridge configurado',
      category: 'technical',
      severity: 'warning',
      status  : 'warning',
      actual  : { hasSharedSecret, hasBaseUrl },
      error   : !hasSharedSecret
        ? 'HOLDED_MCP_SHARED_SECRET no configurado'
        : 'NEXT_PUBLIC_HOLDED_MCP_BASE_URL no configurado',
    };
  }

  // Probe the MCP server OAuth discovery endpoint
  const discoveryUrl = `${mcpBaseUrl.replace(/\/$/, '')}/.well-known/oauth-authorization-server`;
  const t0 = Date.now();
  try {
    const res = await fetch(discoveryUrl, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - t0;
    const ok = res.ok && res.headers.get('content-type')?.includes('json');
    return {
      checkId  : 'holded_mcp_bridge_config',
      title    : 'Holded MCP bridge configurado y accesible',
      category : 'technical',
      severity : 'warning',
      status   : ok ? 'passed' : 'warning',
      actual   : { hasSharedSecret, hasBaseUrl, discoveryStatus: res.status },
      latencyMs,
      error    : ok ? null : `MCP server devolvió ${res.status} en ${discoveryUrl}`,
    };
  } catch (err) {
    return {
      checkId : 'holded_mcp_bridge_config',
      title   : 'Holded MCP bridge configurado y accesible',
      category: 'technical',
      severity: 'warning',
      status  : 'warning',
      actual  : { hasSharedSecret, hasBaseUrl },
      error   : `No se pudo conectar con MCP server: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
