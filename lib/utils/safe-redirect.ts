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
