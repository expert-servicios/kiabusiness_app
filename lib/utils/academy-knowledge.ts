import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// This module only loads and validates content. Student access must always be
// enforced by the server-side route before an article body is rendered.

export const academyKnowledgeStatuses = ['draft', 'review', 'validated', 'pending_update', 'outdated'] as const;

export interface AcademyKnowledgeArticle {
  slug: string;
  title: string;
  module: number;
  access: 'public' | 'student';
  status: (typeof academyKnowledgeStatuses)[number];
  updatedAt: string;
  sourcesVerifiedAt?: string;
  readTime: string;
  tags: string[];
  phase: string;
  tools: string[];
  body: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'academy', 'gestion-laboral', 'knowledge');

const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.literal('laboral'),
  module: z.coerce.number().int().min(0),
  access: z.enum(['public', 'student']),
  status: z.enum(academyKnowledgeStatuses),
  updatedAt: z.iso.date(),
  readTime: z.string().min(1),
  tags: z.array(z.string().min(1)),
  tools: z.array(z.string().min(1)).default([]),
  sourcesVerifiedAt: z.iso.date().optional(),
});

const PHASE_BY_MODULE: Record<number, string> = {
  0: 'Orientación',
  1: 'Mapa del proceso',
  2: 'Convenio y salarios',
  3: 'Configuración',
  4: 'Configuración',
  5: 'Incorporación',
  6: 'Nómina',
  7: 'Cotización',
  8: 'Cambios y bajas',
  9: 'Cierre',
};

const TOOL_ALIASES: Array<{ name: string; matches: string[] }> = [
  { name: 'Holded', matches: ['holded'] },
  { name: 'Sistema RED', matches: ['sistema red', 'red directo'] },
  { name: 'SILTRA', matches: ['siltra', 'sistema de liquidación directa', 'sld', 'rnt', 'rlc', 'dcl', 'cra'] },
  { name: 'DelegaRed', matches: ['delegared'] },
  { name: 'NetContrata', matches: ['netcontrata'] },
  { name: 'Contrat@', matches: ['contrat@'] },
  { name: 'Certific@2', matches: ['certific@2'] },
  { name: 'TGSS', matches: ['tgss', 'afiliación', 'idc'] },
  { name: 'SEPE', matches: ['sepe', 'certificado de empresa'] },
  { name: 'AEAT', matches: ['modelo 111', 'modelo 190'] },
];

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Falta el bloque de frontmatter delimitado por ---');

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    data[key] = value.replace(/^(["'])(.*)\1$/, '$2');
  }

  return { data, body: match[2].trim() };
}

function parseInlineList(raw: string | undefined): string[] {
  if (!raw) return [];
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  return inner.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function getTools(tags: string[]): string[] {
  const normalizedTags = tags.map((tag) => tag.toLocaleLowerCase('es'));
  return TOOL_ALIASES
    .filter(({ matches }) => matches.some((match) => normalizedTags.some((tag) => tag.includes(match))))
    .map(({ name }) => name);
}

export function parseAcademyKnowledgeArticle(filename: string, raw: string): AcademyKnowledgeArticle {
  const { data, body } = parseFrontmatter(raw);
  const parsed = frontmatterSchema.safeParse({
    ...data,
    tags: parseInlineList(data.tags),
    tools: parseInlineList(data.tools),
  });

  if (!parsed.success) {
    throw new Error(`Frontmatter no válido en ${filename}: ${z.prettifyError(parsed.error)}`);
  }

  return {
    ...parsed.data,
    sourcesVerifiedAt: parsed.data.sourcesVerifiedAt,
    phase: PHASE_BY_MODULE[parsed.data.module] ?? 'Otros',
    tools: getTools([...parsed.data.tags, ...parsed.data.tools]),
    body,
  };
}

function loadAll(): AcademyKnowledgeArticle[] {
  let filenames: string[];
  try {
    // The numbered filename prefix is the authoritative reading order.
    filenames = fs.readdirSync(KNOWLEDGE_DIR).filter((filename) => filename.endsWith('.md')).sort();
  } catch {
    return [];
  }

  return filenames.map((filename) => {
    const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), 'utf-8');
    return parseAcademyKnowledgeArticle(filename, raw);
  });
}

let cache: AcademyKnowledgeArticle[] | null = null;

export function getAcademyKnowledgeArticles(): AcademyKnowledgeArticle[] {
  if (!cache) cache = loadAll();
  return cache;
}

export function getAcademyKnowledgeArticle(slug: string): AcademyKnowledgeArticle | undefined {
  return getAcademyKnowledgeArticles().find((article) => article.slug === slug);
}
