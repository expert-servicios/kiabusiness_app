import { absoluteAppUrl } from '@/lib/utils/app-url';
import { articleDateValue, getPublishedBlogArticles } from '@/lib/utils/blog';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildBlogRss(): string {
  const articles = getPublishedBlogArticles().slice(0, 30);
  const updatedAt = new Date().toUTCString();
  const items = articles
    .map((article) => {
      const link = absoluteAppUrl(`/blog/${article.slug}`);
      const pubDateValue = articleDateValue(article.date);
      const pubDate = new Date(pubDateValue || Date.now()).toUTCString();

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${escapeXml(link)}</link>
          <guid isPermaLink="true">${escapeXml(link)}</guid>
          <description>${escapeXml(article.excerpt)}</description>
          <category>${escapeXml(article.category)}</category>
          <pubDate>${pubDate}</pubDate>
        </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>EXPERT Blog</title>
    <link>${escapeXml(absoluteAppUrl('/blog'))}</link>
    <description>Guias practicas sobre fiscalidad, extranjeria, gestion de empresas y Holded.</description>
    <language>es-ES</language>
    <lastBuildDate>${updatedAt}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}
