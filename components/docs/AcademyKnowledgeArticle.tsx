import type { ReactNode } from 'react';
import { ExternalLink, FileText, PlayCircle } from 'lucide-react';

export function AcademyKnowledgeArticleBody({ body }: { body: string }) {
  const lines = body.trim().replace(/^#\s[^\n]*\n?/, '').split('\n');
  const elements: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      elements.push(
        <section key={`h2-${index}`} className="scroll-mt-24 pt-4" id={slugify(heading)}>
          <div className="mb-1 flex items-center gap-3 border-b border-[#D4A017]/25 pb-3">
            <FileText className="h-5 w-5 shrink-0 text-[#D4A017]" />
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{renderInline(heading)}</h2>
          </div>
        </section>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      const heading = line.slice(4).trim();
      elements.push(
        <h3 key={`h3-${index}`} id={slugify(heading)} className="scroll-mt-24 pt-3 font-serif text-xl font-bold text-[#0D1B2A]">
          {renderInline(heading)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      elements.push(
        <pre key={`code-${index}`} className="overflow-x-auto bg-[#0D1B2A] p-4 text-xs leading-6 text-[#F8F6F1]">
          <code data-language={language || undefined}>{code.join('\n')}</code>
        </pre>
      );
      index += 1;
      continue;
    }

    if (isTableRow(line) && isTableDivider(lines[index + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      elements.push(
        <div key={`table-${index}`} className="overflow-x-auto border border-[#0D1B2A]/10">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead className="bg-[#0D1B2A] text-[#F8F6F1]">
              <tr>{headers.map((cell, cellIndex) => <th key={cellIndex} className="px-4 py-3 font-semibold">{renderInline(cell)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-[#0D1B2A]/10 odd:bg-white even:bg-[#F8F6F1]">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top leading-6 text-[#23364D]">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-[#D4A017] bg-[#D4A017]/8 px-5 py-4 text-sm leading-7 text-[#23364D] md:text-base">
          {renderInline(quote.join(' '))}
        </blockquote>
      );
      continue;
    }

    const media = parseLinkedImage(line);
    if (media) {
      elements.push(
        <a
          key={`media-${index}`}
          href={media.href}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden border border-[#D4A017]/30 bg-white"
        >
          <div className="relative aspect-video overflow-hidden bg-[#0D1B2A]">
            {/* External provider thumbnails cannot use next/image without expanding the global host allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.src} alt={media.alt} className="h-full w-full object-cover opacity-85 transition group-hover:scale-[1.02] group-hover:opacity-100" />
            <PlayCircle className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
          </div>
          <span className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#0D1B2A]">
            {media.alt}<ExternalLink className="h-4 w-4 shrink-0 text-[#D4A017]" />
          </span>
        </a>
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s/, ''));
        index += 1;
      }
      elements.push(
        <ul key={`ul-${index}`} className="space-y-2 text-sm leading-6 text-[#23364D] md:text-base">
          {items.map((item, itemIndex) => {
            const checkbox = item.match(/^\[([ xX])\]\s+(.*)$/);
            return (
              <li key={itemIndex} className="flex items-start gap-3">
                {checkbox ? (
                  <span aria-hidden="true" className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-[#D4A017] text-[10px] font-bold text-[#0D1B2A]">
                    {checkbox[1].trim() ? '✓' : ''}
                  </span>
                ) : (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#D4A017]" />
                )}
                <span>{renderInline(checkbox ? checkbox[2] : item)}</span>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      const start = Number(line.match(/^(\d+)\./)?.[1] ?? 1);
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/, ''));
        index += 1;
      }
      elements.push(
        <ol key={`ol-${index}`} start={start} className="list-decimal space-y-2 pl-6 text-sm leading-6 text-[#23364D] marker:font-bold marker:text-[#A97600] md:text-base">
          {items.map((item, itemIndex) => <li key={itemIndex} className="pl-1">{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    elements.push(
      <p key={`p-${index}`} className="text-sm leading-7 text-[#23364D] md:text-base">
        {renderInline(paragraph.join(' '))}
      </p>
    );
  }

  return <article className="space-y-5">{elements}</article>;
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];
  return /^(#{2,3}\s|```|>\s|[-*]\s|\d+\.\s)/.test(line)
    || parseLinkedImage(line) !== null
    || (isTableRow(line) && isTableDivider(lines[index + 1]));
}

function isTableRow(line: string | undefined): boolean {
  return Boolean(line?.trim().startsWith('|') && line.trim().endsWith('|'));
}

function isTableDivider(line: string | undefined): boolean {
  return Boolean(line && /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line.trim()));
}

function tableCells(line: string): string[] {
  return line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
}

function parseLinkedImage(line: string): { alt: string; src: string; href: string } | null {
  const match = line.trim().match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/);
  if (!match) return null;
  return { alt: match[1], src: match[2], href: match[3] };
}

function renderInline(text: string): ReactNode[] {
  const patterns = [
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
    { type: 'bold', regex: /\*\*([^*]+)\*\*/g },
    { type: 'code', regex: /`([^`]+)`/g },
  ] as const;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    let candidate: { type: (typeof patterns)[number]['type']; match: RegExpExecArray } | null = null;
    for (const pattern of patterns) {
      pattern.regex.lastIndex = cursor;
      const match = pattern.regex.exec(text);
      if (match && (!candidate || match.index < candidate.match.index)) candidate = { type: pattern.type, match };
    }
    if (!candidate) {
      nodes.push(text.slice(cursor));
      break;
    }
    if (candidate.match.index > cursor) nodes.push(text.slice(cursor, candidate.match.index));

    if (candidate.type === 'bold') {
      nodes.push(<strong key={key++} className="font-semibold text-[#0D1B2A]">{candidate.match[1]}</strong>);
    } else if (candidate.type === 'code') {
      nodes.push(<code key={key++} className="rounded bg-[#0D1B2A]/8 px-1 py-0.5 font-mono text-xs">{candidate.match[1]}</code>);
    } else {
      const href = candidate.match[2];
      const external = /^https?:\/\//.test(href);
      nodes.push(
        <a
          key={key++}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          className="font-semibold text-[#8A6200] underline decoration-[#D4A017]/50 underline-offset-2 hover:text-[#0D1B2A]"
        >
          {candidate.match[1]}{external && <ExternalLink className="ml-1 inline h-3 w-3" />}
        </a>
      );
    }
    cursor = candidate.match.index + candidate.match[0].length;
  }

  return nodes;
}

function slugify(text: string) {
  return text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
