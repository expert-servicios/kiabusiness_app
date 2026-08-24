import { FileText } from 'lucide-react';

// Same lightweight markdown-subset renderer used by app/(public)/docs/[slug]/page.tsx
// (## headings split into sections, ### sub-headings, lists, **bold**/`code`
// inline). Duplicated rather than shared to avoid touching the existing,
// already-live public docs page while building this gated variant.

export function AcademyKnowledgeArticleBody({ body }: { body: string }) {
  const sections = getSections(body);
  return (
    <div className="space-y-10">
      {sections.map((s) => (
        <Section key={s.heading} heading={s.heading} content={s.content} />
      ))}
    </div>
  );
}

function getSections(body: string) {
  // Every knowledge manual starts with a top-level "# Title" before its
  // "## " sections — strip it here so it doesn't become a bogus first
  // section (the title is already rendered in the page hero).
  const withoutH1 = body.trim().replace(/^#\s[^\n]*\n?/, '');

  return withoutH1
    .trim()
    .split(/\n(?=## )/)
    .filter(Boolean)
    .map((block) => {
      const lines = block.trim().split('\n');
      const heading = lines[0].replace(/^## /, '');
      const content = lines.slice(1).join('\n').trim();
      return { heading, content };
    });
}

function Section({ heading, content }: { heading: string; content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-serif text-lg font-bold text-[#0D1B2A]">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      const items = [line.replace('- ', '')];
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++;
        items.push(lines[i].replace('- ', ''));
      }
      elements.push(
        <ul key={i} className="space-y-2 text-sm leading-6 text-[#23364D] md:text-base">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#D4A017]" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            </li>
          ))}
        </ul>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const items = [line.replace(/^\d+\.\s/, '')];
      while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1])) {
        i++;
        items.push(lines[i].replace(/^\d+\.\s/, ''));
      }
      elements.push(
        <ol key={i} className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[#23364D] md:text-base">
          {items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ol>
      );
    } else if (line.trim()) {
      elements.push(
        <p
          key={i}
          className="text-sm leading-7 text-[#23364D] md:text-base"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
    }
    i++;
  }

  return (
    <section id={slugify(heading)}>
      <div className="mb-4 flex items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-[#D4A017]" />
        <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{heading}</h2>
      </div>
      <div className="space-y-4">{elements}</div>
    </section>
  );
}

function renderInline(text: string): string {
  return escapeInlineHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-[#0D1B2A]/8 px-1 py-0.5 text-xs font-mono">$1</code>');
}

function escapeInlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DIACRITIC_RANGE_START = 0x0300;
const DIACRITIC_RANGE_END = 0x036f;

function slugify(text: string) {
  let normalized = '';
  for (const ch of text.toLowerCase().normalize('NFD')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= DIACRITIC_RANGE_START && code <= DIACRITIC_RANGE_END) continue;
    normalized += ch;
  }
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
