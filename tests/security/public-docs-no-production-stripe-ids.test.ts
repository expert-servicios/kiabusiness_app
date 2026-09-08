import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS_DIR = join(process.cwd(), 'docs');
const PRODUCTION_LIKE_STRIPE_ID = /\b(?:cus|sub|in|pi|cs)_[A-Za-z0-9]{12,}\b/g;

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory()
      ? markdownFiles(path)
      : path.endsWith('.md')
        ? [path]
        : [];
  });
}

describe('public repository documentation hygiene', () => {
  it('does not contain production-like Stripe object identifiers', () => {
    const findings = markdownFiles(DOCS_DIR).flatMap((path) => {
      const content = readFileSync(path, 'utf8');
      const matches = [...content.matchAll(PRODUCTION_LIKE_STRIPE_ID)].map((match) => match[0]);
      return matches.length > 0
        ? [{ file: relative(process.cwd(), path), matches: [...new Set(matches)] }]
        : [];
    });

    expect(findings).toEqual([]);
  });
});
