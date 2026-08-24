import fs from 'fs';
import path from 'path';

// Loads the "Gestión Laboral Integral" student knowledge base from
// content/academy/gestion-laboral/knowledge/*.md. Access control (public vs
// student-gated) is read from frontmatter but MUST be enforced server-side
// by the caller (checking session + an active academy_enrollments row) —
// this loader only parses content, it does not gate anything.

export interface AcademyKnowledgeArticle {
  slug: string;
  title: string;
  module: number;
  access: 'public' | 'student';
  status: 'draft' | 'validated' | 'pending_update';
  updatedAt: string;
  readTime: string;
  tags: string[];
  body: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'academy', 'gestion-laboral', 'knowledge');

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    data[key] = value;
  }

  return { data, body: match[2].trim() };
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  return inner.split(',').map((t) => t.trim()).filter(Boolean);
}

function loadAll(): AcademyKnowledgeArticle[] {
  let filenames: string[];
  try {
    // Sort by filename (00-, 01-, 02-...) — the numbered prefix is the
    // authoritative operational sequence. The `module` frontmatter field
    // maps articles to course modules and isn't 1:1 with file order (some
    // modules span multiple manuals), so it must not be used for sorting.
    filenames = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md')).sort();
  } catch {
    return [];
  }

  return filenames
    .map((filename) => {
      const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), 'utf-8');
      const { data, body } = parseFrontmatter(raw);

      const access = data.access === 'public' ? 'public' : 'student';
      const status: AcademyKnowledgeArticle['status'] =
        data.status === 'validated' || data.status === 'pending_update' ? data.status : 'draft';

      return {
        slug: data.slug ?? filename.replace(/^\d+-/, '').replace(/\.md$/, ''),
        title: data.title ?? filename,
        module: Number(data.module ?? 0),
        access,
        status,
        updatedAt: data.updatedAt ?? '',
        readTime: data.readTime ?? '',
        tags: parseTags(data.tags),
        body,
      } satisfies AcademyKnowledgeArticle;
    });
}

let cache: AcademyKnowledgeArticle[] | null = null;

export function getAcademyKnowledgeArticles(): AcademyKnowledgeArticle[] {
  if (!cache) cache = loadAll();
  return cache;
}

export function getAcademyKnowledgeArticle(slug: string): AcademyKnowledgeArticle | undefined {
  return getAcademyKnowledgeArticles().find((a) => a.slug === slug);
}
