'use client';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function getRecaptchaSiteKey(): string {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
}

async function waitForGrecaptcha(timeoutMs = 2000): Promise<boolean> {
  const started = Date.now();
  while (typeof window !== 'undefined' && !window.grecaptcha && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return typeof window !== 'undefined' && Boolean(window.grecaptcha);
}

export async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey || typeof window === 'undefined') return '';
  const ready = await waitForGrecaptcha();
  if (!ready || !window.grecaptcha) return '';

  try {
    return await new Promise((resolve) => {
      window.grecaptcha?.ready(() => {
        window.grecaptcha
          ?.execute(siteKey, { action })
          .then(resolve)
          .catch(() => resolve(''));
      });
    });
  } catch {
    return '';
  }
}
