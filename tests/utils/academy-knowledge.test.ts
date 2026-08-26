import { describe, expect, it } from 'vitest';
import {
  getAcademyKnowledgeArticle,
  getAcademyKnowledgeArticles,
  parseAcademyKnowledgeArticle,
} from '@/lib/utils/academy-knowledge';

describe('academy labor knowledge base', () => {
  it('loads the complete manual collection in numbered editorial order', () => {
    const articles = getAcademyKnowledgeArticles();

    expect(articles).toHaveLength(16);
    expect(articles[0].slug).toBe('indice');
    expect(articles.at(-1)?.slug).toBe('recursos-audiovisuales-capturas-laboral');
  });

  it('keeps only explicitly public manuals outside the student gate', () => {
    const publicSlugs = getAcademyKnowledgeArticles()
      .filter((article) => article.access === 'public')
      .map((article) => article.slug);

    expect(publicSlugs).toEqual(['indice', 'mapa-herramientas-laborales']);
  });

  it('derives phase and tool filters from validated metadata', () => {
    const article = getAcademyKnowledgeArticle('holded-siltra-liquidacion');

    expect(article?.phase).toBe('Cotización');
    expect(article?.tools).toEqual(expect.arrayContaining(['Holded', 'SILTRA']));
    expect(article?.status).toBe('review');

    const siltraArticle = getAcademyKnowledgeArticle('siltra-cotizaciones');
    expect(siltraArticle?.tools).toEqual(expect.arrayContaining(['Holded', 'SILTRA']));

    const variationsArticle = getAcademyKnowledgeArticle('variaciones');
    expect(variationsArticle?.tools).toEqual(expect.arrayContaining(['NetContrata', 'Sistema RED']));
  });

  it('uses routed slugs instead of Markdown source paths in internal links', () => {
    const invalidLinks = getAcademyKnowledgeArticles()
      .flatMap((article) => article.body.match(/\]\(\.\/[^)]*\.md\)/g) ?? []);

    expect(invalidLinks).toEqual([]);
  });

  it('rejects malformed or incomplete frontmatter', () => {
    expect(() => parseAcademyKnowledgeArticle('broken.md', '---\ntitle: Sin datos\n---\n# Sin datos'))
      .toThrow(/Frontmatter no válido/);
  });
});
