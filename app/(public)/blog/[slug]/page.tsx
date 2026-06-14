import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, ArrowRight, Tag } from 'lucide-react';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { blogArticles, getArticle } from '@/lib/utils/blog';
import { getDocRedirectTarget } from '@/lib/utils/docs';

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocRedirectTarget(slug);
  if (doc) {
    return {
      title: doc.seoTitle ?? `${doc.title} | EXPERT Docs`,
      description: doc.seoDescription ?? doc.excerpt,
      alternates: {
        canonical: `https://expertconsulting.es/docs/${doc.slug}`
      }
    };
  }

  const article = getArticle(slug);
  if (!article) return {};
  const title = `${article.title} | EXPERT Blog`;
  const canonicalUrl = `https://expertconsulting.es/blog/${slug}`;

  return {
    title,
    description: article.excerpt,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description: article.excerpt,
      url: canonicalUrl,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: article.excerpt
    }
  };
}

const categoryColors: Record<string, string> = {
  Fiscalidad: 'text-[#D4A017] border-[#D4A017]/40 bg-[#D4A017]/10',
  Extranjería: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  Empresas: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  Holded: 'text-rose-400 border-rose-400/40 bg-rose-400/10',
  Trámites: 'text-purple-400 border-purple-400/40 bg-purple-400/10'
};

export default async function BlogArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDocRedirectTarget(slug);
  if (doc) redirect(`/docs/${doc.slug}`);

  const article = getArticle(slug);
  if (!article) return notFound();

  const related = blogArticles.filter((a) => a.slug !== slug && a.category === article.category).slice(0, 2);
  const colorClass = categoryColors[article.category] ?? 'text-[#D4A017] border-[#D4A017]/40';

  // Convert markdown-like body to simple HTML sections
  const sections = article.body
    .trim()
    .split(/\n(?=## )/)
    .filter(Boolean)
    .map((block) => {
      const lines = block.trim().split('\n');
      const heading = lines[0].replace(/^## /, '');
      const content = lines.slice(1).join('\n').trim();
      return { heading, content };
    });

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] transition hover:text-[#D4A017]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Blog
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className={`inline-block border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
            <span className="text-xs text-[#9CA3AF]">{article.date}</span>
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold leading-tight md:text-4xl">{article.title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#9CA3AF] md:text-base">{article.excerpt}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_260px] lg:items-start">
          {/* Article body */}
          <article className="space-y-8">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="inline-flex min-h-8 items-center gap-1 border border-[#D4A017]/25 bg-white px-2.5 text-xs text-[#23364D]">
                  <Tag className="h-3 w-3 text-[#D4A017]" />
                  {tag}
                </span>
              ))}
            </div>

            {sections.map(({ heading, content }) => (
              <Section key={heading} heading={heading} content={content} />
            ))}

            {/* CTA */}
            <div className="mt-8 border border-[#D4A017]/30 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">¿Necesitas ayuda con este trámite?</p>
              <p className="mt-2 text-sm leading-6 text-[#23364D]">
                En EXPERT gestionamos este tipo de casos a diario. Cuéntanos tu situación y te orientamos sin compromiso.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/solicitar-presupuesto"
                  className="inline-flex items-center gap-2 bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                >
                  Solicitar presupuesto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://wa.me/34696550480"
                  className="inline-flex items-center gap-2 border border-[#D4A017]/50 px-5 py-2.5 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-[#0D1B2A] p-5 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">EXPERT</p>
              <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
                Asesoría fiscal, legal y administrativa para residentes, expatriados y empresas en España. Gestión 100 % online.
              </p>
              <Link
                href="/sobre-mi"
                className="mt-4 block text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Conocer más sobre EXPERT →
              </Link>
            </div>

            <div className="border border-[#D4A017]/25 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Novedades</p>
              <p className="mt-2 text-sm leading-6 text-[#23364D]">
                Recibe avisos sobre nuevos trámites, guías y cambios prácticos.
              </p>
              <div className="mt-4">
                <NewsletterForm source={`blog:${article.slug}`} variant="light" layout="vertical" />
              </div>
            </div>

            {related.length > 0 && (
              <div className="border border-[#D4A017]/25 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Artículos relacionados</p>
                <ul className="mt-4 space-y-4">
                  {related.map((a) => (
                    <li key={a.slug} className="border-b border-[#D4A017]/15 pb-4 last:border-0 last:pb-0">
                      <Link
                        href={`/blog/${a.slug}`}
                        className="text-sm font-semibold leading-snug text-[#0D1B2A] hover:text-[#D4A017]"
                      >
                        {a.title}
                      </Link>
                      <p className="mt-1 text-xs text-[#9CA3AF]">{a.date}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border border-[#D4A017]/25 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Servicios relacionados</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana" className="text-[#D4A017] hover:text-[#F2C14E]">Nacionalidad menor nacido en España</Link></li>
                <li><Link href="/servicios/declaraciones-impuestos" className="text-[#D4A017] hover:text-[#F2C14E]">Fiscalidad</Link></li>
                <li><Link href="/servicios/extranjeria-nacionalidad" className="text-[#D4A017] hover:text-[#F2C14E]">Extranjería y Nacionalidad</Link></li>
                <li><Link href="/servicios/empresas-autonomos" className="text-[#D4A017] hover:text-[#F2C14E]">Empresas y Autónomos</Link></li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Back link */}
        <div className="mt-12 border-t border-[#D4A017]/20 pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017] hover:text-[#F2C14E]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al blog
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ heading, content }: { heading: string; content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-serif text-lg font-bold text-[#0D1B2A]">{line.replace('### ', '')}</h3>
      );
    } else if (line.startsWith('| ')) {
      const tableLines = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[-| ]+\|$/));
      elements.push(
        <div key={i} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {rows.map((row, ri) => {
              const cells = row.split('|').filter((c) => c.trim());
              const Tag = ri === 0 ? 'th' : 'td';
              return (
                <tr key={ri} className={ri === 0 ? 'bg-[#0D1B2A] text-[#F8F6F1]' : ri % 2 === 0 ? 'bg-[#F8F6F1]' : 'bg-white'}>
                  {cells.map((cell, ci) => (
                    <Tag key={ci} className={`border border-[#D4A017]/20 px-3 py-2 text-left ${ri === 0 ? 'font-bold text-xs uppercase tracking-wide' : 'text-[#23364D]'}`}>
                      {cell.trim()}
                    </Tag>
                  ))}
                </tr>
              );
            })}
          </table>
        </div>
      );
    } else if (line.startsWith('- ')) {
      const items = [line.replace('- ', '')];
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++;
        items.push(lines[i].replace('- ', ''));
      }
      elements.push(
        <ul key={i} className="space-y-1.5 text-sm leading-6 text-[#23364D]">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A017]" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            </li>
          ))}
        </ul>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm leading-7 text-[#23364D] md:text-base"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
    }
    i++;
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-[#0D1B2A] md:text-2xl">{heading}</h2>
      <div className="mt-4 space-y-3">{elements}</div>
    </div>
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
