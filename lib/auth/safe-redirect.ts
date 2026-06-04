/**
 * Sanitiza un valor `next` de query string para evitar open-redirect.
 *
 * Reglas:
 * - Debe empezar por `/` y NO por `//` (protocol-relative URL).
 * - No puede contener `\` (vector de bypass en algunos parsers).
 * - Si la URL parseada tiene un origin distinto al esperado, rechaza.
 * - Fallback siempre a `/dashboard`.
 */
export function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard';
  }

  try {
    const parsed = new URL(value, 'https://expert.local');
    if (parsed.origin !== 'https://expert.local') {
      return '/dashboard';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}
