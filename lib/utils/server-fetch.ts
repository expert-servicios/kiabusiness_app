import { cookies } from 'next/headers';
import { absoluteAppUrl } from '@/lib/utils/app-url';

/**
 * Fetches an internal API route from a Next.js Server Component by forwarding
 * the current request's cookies (session auth). Returns null on any error.
 *
 * Usage:
 *   const data = await fetchWithCookies<{ quotes: Quote[] }>('/api/quotes');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchWithCookies<T = any>(path: string): Promise<T | null> {
  try {
    const cookieStore  = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl(path), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
