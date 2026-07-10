// Public Holded URLs, centralized so a leading BOM/whitespace picked up when
// these env vars were set (e.g. via PowerShell piping on Vercel/Windows) gets
// stripped once here instead of independently — or not at all — in every
// consumer. A stray BOM turns "https://..." into an unparseable string that
// Next's <Link>/<a href> then resolves as a path relative to the current
// origin (e.g. expertconsulting.es/%EF%BB%BFhttps:/www.holded.com/es).

function cleanUrl(value: string | undefined, fallback: string): string {
  const cleaned = value?.replace(/^﻿/, '').trim();
  return cleaned || fallback;
}

export function getHoldedTrialUrl(): string {
  return cleanUrl(process.env.NEXT_PUBLIC_HOLDED_TRIAL_URL, 'https://www.holded.com/es');
}

export function getHoldedApiDocsUrl(): string {
  return cleanUrl(process.env.NEXT_PUBLIC_HOLDED_API_DOCS_URL, 'https://developers.holded.com');
}

export function getHoldedAcademyUrl(): string {
  return cleanUrl(process.env.NEXT_PUBLIC_HOLDED_ACADEMY_URL, 'https://www.holded.com/es/academia');
}

export function getHoldedMcpBaseUrl(): string {
  return cleanUrl(process.env.NEXT_PUBLIC_HOLDED_MCP_BASE_URL, 'https://claude.expertconsulting.es');
}
