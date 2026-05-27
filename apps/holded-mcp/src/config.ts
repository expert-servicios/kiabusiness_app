import process from 'node:process';
import { z } from 'zod';

try {
  process.loadEnvFile?.();
} catch {
  // Vercel y otros runtimes suelen inyectar variables directamente.
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  BASE_URL: z.string().url(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  OAUTH_ALLOWED_REDIRECT_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  ALLOW_STATELESS_OAUTH_IN_PRODUCTION: z.enum(['0', '1']).default('0'),
  OAUTH_JWT_SECRET: z.string().min(32),
  OAUTH_DATA_ENCRYPTION_SECRET: z.string().min(32).optional(),
  OAUTH_AUTH_CODE_TTL_SECONDS: z.coerce.number().default(600),
  OAUTH_TOKEN_TTL_SECONDS: z.coerce.number().default(3600),
  OAUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(2592000),
  OAUTH_CLIENT_ID: z.string().min(1),
  OAUTH_CLIENT_SECRET: z.string().min(16),
  HOLDED_API_BASE: z.string().url().default('https://api.holded.com'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  // EXPERT integration mode. Keep the bridge and central registry disabled
  // until EXPERT exposes the matching auth/upsert endpoints.
  EXPERT_APP_URL: z.string().url().default('https://expertconsulting.es'),
  EXPERT_APP_SHARED_SECRET: z.string().optional(),
  EXPERT_PUBLIC_URL: z.string().url().default('https://expertconsulting.es'),
  EXPERT_OAUTH_BRIDGE_ENABLED: z.enum(['0', '1']).default('0'),
  EXPERT_CENTRAL_REGISTRY_ENABLED: z.enum(['0', '1']).default('0'),
  // Legacy Verifactu names are accepted only to keep old deploys bootable.
  VERIFACTU_APP_URL: z.string().url().optional(),
  VERIFACTU_APP_SHARED_SECRET: z.string().optional(),
  HOLDED_PUBLIC_URL: z.string().url().optional(),
  // Optional bridge cookie secret. Required only when EXPERT_OAUTH_BRIDGE_ENABLED=1.
  SESSION_SECRET: z.string().min(16).optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Variables de entorno invalidas:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  const data = result.data;

  if (
    data.NODE_ENV === 'production' &&
    !data.DATABASE_URL &&
    data.ALLOW_STATELESS_OAUTH_IN_PRODUCTION !== '1'
  ) {
    console.error(
      'DATABASE_URL is required in production for the Claude MCP OAuth store. Set ALLOW_STATELESS_OAUTH_IN_PRODUCTION=1 only for an emergency degraded rollout.'
    );
    process.exit(1);
  }

  if (
    data.NODE_ENV === 'production' &&
    data.EXPERT_OAUTH_BRIDGE_ENABLED === '1' &&
    !data.SESSION_SECRET
  ) {
    console.error(
      'SESSION_SECRET is required in production when EXPERT_OAUTH_BRIDGE_ENABLED=1.'
    );
    process.exit(1);
  }

  if (
    data.NODE_ENV === 'production' &&
    (data.EXPERT_OAUTH_BRIDGE_ENABLED === '1' ||
      data.EXPERT_CENTRAL_REGISTRY_ENABLED === '1') &&
    !(data.EXPERT_APP_SHARED_SECRET ?? data.VERIFACTU_APP_SHARED_SECRET)
  ) {
    console.error(
      'EXPERT_APP_SHARED_SECRET is required when bridge or central registry integration is enabled.'
    );
    process.exit(1);
  }

  return {
    ...data,
    EXPERT_APP_URL: data.EXPERT_APP_URL ?? data.VERIFACTU_APP_URL ?? 'https://expertconsulting.es',
    EXPERT_APP_SHARED_SECRET: data.EXPERT_APP_SHARED_SECRET ?? data.VERIFACTU_APP_SHARED_SECRET,
    EXPERT_PUBLIC_URL: data.EXPERT_PUBLIC_URL ?? data.HOLDED_PUBLIC_URL ?? 'https://expertconsulting.es',
  };
}

export const config = loadConfig();
export type Config = typeof config;
