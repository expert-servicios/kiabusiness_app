interface RecaptchaVerifyParams {
  token: string;
  action: string;
  minScore?: number;
}

interface RecaptchaResponse {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface RecaptchaVerifyResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  score?: number;
  action?: string;
}

function minScore(defaultValue: number): number {
  const parsed = Number(process.env.RECAPTCHA_MIN_SCORE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export async function verifyRecaptchaToken({
  token,
  action,
  minScore: inputMinScore
}: RecaptchaVerifyParams): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[recaptcha] RECAPTCHA_SECRET_KEY not configured');
      return { ok: false, reason: 'not_configured' };
    }
    return { ok: true, skipped: true, reason: 'not_configured' };
  }
  if (!token) return { ok: false, reason: 'missing_token' };

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) return { ok: false, reason: 'verify_request_failed' };

    const data = (await res.json()) as RecaptchaResponse;
    const requiredScore = inputMinScore ?? minScore(0.5);
    const score = typeof data.score === 'number' ? data.score : 0;

    if (data.success !== true) {
      return { ok: false, reason: data['error-codes']?.join(',') || 'verification_failed', score, action: data.action };
    }

    if (data.action && data.action !== action) {
      return { ok: false, reason: 'action_mismatch', score, action: data.action };
    }

    if (score < requiredScore) {
      return { ok: false, reason: 'low_score', score, action: data.action };
    }

    return { ok: true, score, action: data.action };
  } catch {
    return { ok: false, reason: 'verification_error' };
  }
}
