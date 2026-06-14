export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

export function verifyCronRequest(headers: Headers, label = 'cron'): CronAuthResult {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true };
    }
    console.error(`[${label}] CRON_SECRET not configured`);
    return { ok: false, status: 500, error: 'Cron not configured' };
  }

  const authHeader = headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}
