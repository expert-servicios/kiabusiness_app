import { categories as serviceCategories, getServicesByCategory, type PublicCategorySlug, type Service } from './catalog';
import { docCategories, docs, type DocCategorySlug, type KnowledgeDoc } from './docs';
import { blogArticles, type Article } from './blog';

/**
 * Cross-cutting "temas" (topics) used only to group and cross-link existing
 * content for discovery purposes (e.g. /categoria/[tema] pages).
 *
 * IMPORTANT: this file does not rename or merge any existing category slug
 * used by Servicios (lib/utils/catalog.ts), Docs (lib/utils/docs.ts) or el
 * Blog (lib/utils/blog.ts). All existing URLs (/servicios/[categoria]/...,
 * /docs/[slug], /blog/[slug]) stay exactly as they are. A "tema" here is a
 * higher-level grouping on top of those, so pages built from it link back to
 * the real, unchanged URLs.
 */

export type TemaSlug = 'fiscalidad' | 'extranjeria-nacionalidad' | 'empresas' | 'holded' | 'tramites' | 'formacion';

export type Tema = {
  slug: TemaSlug;
  name: string;
  description: string;
  /** Servicios categories (lib/utils/catalog.ts) grouped under this tema. */
  serviceCategorySlugs: PublicCategorySlug[];
  /** Docs category (lib/utils/docs.ts) mapped to this tema, if any. */
  docCategorySlug?: DocCategorySlug;
  /** Blog categories (Article.category values) mapped to this tema. */
  blogCategories: string[];
};

export const temas: Tema[] = [
  {
    slug: 'fiscalidad',
    name: 'Fiscalidad',
    description:
      'Declaraciones fiscales para personas físicas, residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.',
    serviceCategorySlugs: ['declaraciones-impuestos'],
    docCategorySlug: 'fiscalidad',
    blogCategories: ['Fiscalidad']
  },
  {
    slug: 'extranjeria-nacionalidad',
    name: 'Extranjería y Nacionalidad',
    description:
      'Residencia, arraigo, reagrupación familiar y nacionalidad española: requisitos, documentación y plazos.',
    serviceCategorySlugs: ['extranjeria-nacionalidad'],
    docCategorySlug: 'extranjeria-nacionalidad',
    blogCategories: ['Extranjería']
  },
  {
    slug: 'empresas',
    name: 'Empresas y Autónomos',
    description:
      'Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles.',
    serviceCategorySlugs: ['empresas-autonomos'],
    docCategorySlug: 'empresas',
    blogCategories: ['Empresas']
  },
  {
    slug: 'holded',
    name: 'Holded',
    description: 'Implantación, migración y formación práctica en Holded para autónomos, pymes y empresas.',
    serviceCategorySlugs: ['holded'],
    docCategorySlug: 'holded',
    blogCategories: ['Holded']
  },
  {
    slug: 'tramites',
    name: 'Trámites administrativos',
    description:
      'Certificados digitales, tráfico y capitanía marítima, notaría y propiedades: gestiones administrativas variadas.',
    serviceCategorySlugs: ['certificado-digital', 'trafico-capitania-maritima', 'notaria-propiedades'],
    docCategorySlug: 'tramites',
    blogCategories: ['Trámites']
  },
  {
    slug: 'formacion',
    name: 'Formación',
    description: 'Programas de formación en gestión empresarial y fiscalidad de EXPERT Business Academy.',
    serviceCategorySlugs: [],
    blogCategories: ['Formación']
  }
];

export function getTema(slug: string): Tema | undefined {
  return temas.find((t) => t.slug === slug);
}

export function getServicesForTema(tema: Tema): { categorySlug: PublicCategorySlug; categoryName: string; services: Service[] }[] {
  return tema.serviceCategorySlugs.map((categorySlug) => ({
    categorySlug,
    categoryName: serviceCategories.find((c) => c.slug === categorySlug)?.name ?? categorySlug,
    services: getServicesByCategory(categorySlug)
  }));
}

export function getDocsForTema(tema: Tema): KnowledgeDoc[] {
  if (!tema.docCategorySlug) return [];
  return docs.filter((doc) => doc.category === tema.docCategorySlug);
}

export function getDocCategoryName(tema: Tema): string | undefined {
  return tema.docCategorySlug ? docCategories.find((c) => c.slug === tema.docCategorySlug)?.name : undefined;
}

export function getArticlesForTema(tema: Tema): Article[] {
  return blogArticles.filter((article) => tema.blogCategories.includes(article.category));
}
