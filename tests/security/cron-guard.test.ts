import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCronRequest } from '@/lib/security/cron';

describe('verifyCronRequest', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed in production when CRON_SECRET is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');

    expect(verifyCronRequest(new Headers())).toEqual({
      ok: false,
      status: 500,
      error: 'Cron not configured',
    });
  });

  it('allows local development without CRON_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CRON_SECRET', '');

    expect(verifyCronRequest(new Headers())).toEqual({ ok: true });
  });

  it('rejects requests with the wrong bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'expected-secret');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer wrong' }))).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });

  it('accepts requests with the configured bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'expected-secret');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer expected-secret' }))).toEqual({ ok: true });
  });
});
