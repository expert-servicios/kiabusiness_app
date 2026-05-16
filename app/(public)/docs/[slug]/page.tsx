import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, FileText, MessageCircle, Tag } from 'lucide-react';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { categories, services } from '@/lib/utils/catalog';
import { docs, getDoc, getDocCategory } from '@/lib/utils/docs';

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};

  const title = doc.seoTitle ?? `${doc.title} | EXPERT Docs`;
  const description = doc.seoDescription ?? doc.excerpt;
  const canonicalUrl = `https://expertconsulting.es/docs/${slug}`;

  return {
    title,
    description,
    keywords: doc.tags,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

export default async function DocDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return notFound();

  const category = getDocCategory(doc.category);
  const relatedServices = services.filter((service) => doc.relatedServiceSlugs?.includes(service.slug));
  const relatedDocs = docs
    .filter((item) => item.slug !== doc.slug)
    .filter((item) => item.category === doc.category || item.tags.some((tag) => doc.tags.includes(tag)))
    .slice(0, 3);

  const sections = getSections(doc.body);
  const canonicalUrl = `https://expertconsulting.es/docs/${doc.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.seoDescription ?? doc.excerpt,
    url: canonicalUrl,
    inLanguage: 'es-ES',
    keywords: doc.tags.join(', '),
    publisher: {
      '@type': 'Organization',
      name: 'EXPERT'
    },
    mainEntityOfPage: canonicalUrl
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] transition hover:text-[#D4A017]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Docs
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">{category?.name}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-3xl font-bold leading-tight md:text-5xl">{doc.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#9CA3AF]">{doc.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#9CA3AF]">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D4A017]" />
              {doc.readTime}
            </span>
            <span>Actualizado: {doc.updatedAt}</span>
          </div>
        </div>
      </section>

      <nav className="border-b border-[#D4A017]/15 bg-white/70 px-6 py-4 text-xs text-[#6B7280]" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <Link href="/docs" className="hover:text-[#D4A017]">Docs</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">{doc.title}</span>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_300px] lg:items-start">
        <article className="space-y-9">
          <div className="flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <span key={tag} className="inline-flex min-h-8 items-center gap-1 border border-[#D4A017]/25 bg-white px-2.5 text-xs text-[#23364D]">
                <Tag className="h-3 w-3 text-[#D4A017]" />
                {tag}
              </span>
            ))}
          </div>

          {sections.map(({ heading, content }) => (
            <Section key={heading} heading={heading} content={content} />
          ))}
        </article>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="border border-[#D4A017]/25 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Contenido</p>
            <ol className="mt-4 space-y-2">
              {sections.map(({ heading }) => (
                <li key={heading}>
                  <a href={`#${slugify(heading)}`} className="text-sm leading-5 text-[#23364D] transition hover:text-[#D4A017]">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {relatedServices.length > 0 && (
            <div className="brand-blue-bg p-5 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Servicio relacionado</p>
              <div className="mt-4 space-y-4">
                {relatedServices.map((service) => {
                  const serviceCategory = categories.find((item) => item.slug === service.categoria);
                  return (
                    <div key={service.slug}>
                      <Link
                        href={`/servicios/${service.categoria}/${service.slug}`}
                        className="font-serif text-lg font-bold leading-tight text-[#F8F6F1] transition hover:text-[#D4A017]"
                      >
                        {service.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#9CA3AF]">{serviceCategory?.name}</p>
                    </div>
                  );
                })}
              </div>
              <a
                href="https://wa.me/34696550480"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-4 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar caso
              </a>
            </div>
          )}

          <div className="border border-[#D4A017]/25 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Novedades</p>
            <p className="mt-2 text-sm leading-6 text-[#23364D]">Recibe nuevas guías y avisos prácticos.</p>
            <div className="mt-4">
              <NewsletterForm source={`docs:${doc.slug}`} variant="light" layout="vertical" />
            </div>
          </div>

          {relatedDocs.length > 0 && (
            <div className="border border-[#D4A017]/25 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Guías relacionadas</p>
              <ul className="mt-4 space-y-4">
                {relatedDocs.map((item) => (
                  <li key={item.slug} className="border-b border-[#D4A017]/15 pb-4 last:border-0 last:pb-0">
                    <Link href={`/docs/${item.slug}`} className="text-sm font-semibold leading-snug text-[#0D1B2A] hover:text-[#D4A017]">
                      <BookOpen className="mr-2 inline h-4 w-4 text-[#D4A017]" />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function getSections(body: string) {
  return body
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
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-[#0D1B2A]/8 px-1 py-0.5 text-xs font-mono">$1</code>');
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
