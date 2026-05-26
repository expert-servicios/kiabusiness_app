import type { MetadataRoute } from 'next';
import { categories, services } from '@/lib/utils/catalog';
import { blogArticles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';

const BASE = 'https://expertconsulting.es';

const MONTHS: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
  jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12'
};

function parseArticleDate(dateStr: string): Date {
  // Format: '13 may 2026'
  const parts = dateStr.trim().toLowerCase().split(' ');
  if (parts.length === 3) {
    const [day, mon, year] = parts;
    const month = MONTHS[mon] ?? '01';
    return new Date(`${year}-${month}-${day.padStart(2, '0')}`);
  }
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                                      changeFrequency: 'weekly',  priority: 1.0, lastModified: now },
    { url: `${BASE}/servicios`,                       changeFrequency: 'monthly', priority: 0.9, lastModified: now },
    { url: `${BASE}/planes`,                          changeFrequency: 'monthly', priority: 0.9, lastModified: now },
    { url: `${BASE}/holded`,                          changeFrequency: 'monthly', priority: 0.8, lastModified: now },
    { url: `${BASE}/holded/conectores`,               changeFrequency: 'monthly', priority: 0.75, lastModified: now },
    { url: `${BASE}/sobre-mi`,                        changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${BASE}/blog`,                            changeFrequency: 'weekly',  priority: 0.8, lastModified: now },
    { url: `${BASE}/docs`,                            changeFrequency: 'weekly',  priority: 0.85, lastModified: now },
    { url: `${BASE}/contacto`,                        changeFrequency: 'yearly',  priority: 0.6, lastModified: now },
    { url: `${BASE}/solicitar-presupuesto`,           changeFrequency: 'yearly',  priority: 0.6, lastModified: now },
    { url: `${BASE}/para-asesorias`,                  changeFrequency: 'monthly', priority: 0.5, lastModified: now },
    // Planes
    { url: `${BASE}/planes/supervision`,              changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${BASE}/planes/avanzado`,                 changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${BASE}/planes/colaborativo`,             changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/planes/presupuesto-personalizado`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    // Especiales
    { url: `${BASE}/nacionalidad-espanola-menor-nacido-en-espana`, changeFrequency: 'monthly', priority: 0.8, lastModified: now },
    // Legal
    { url: `${BASE}/aviso-legal`,   changeFrequency: 'yearly', priority: 0.2, lastModified: now },
    { url: `${BASE}/privacidad`,    changeFrequency: 'yearly', priority: 0.2, lastModified: now },
    { url: `${BASE}/cookies`,       changeFrequency: 'yearly', priority: 0.2, lastModified: now },
    { url: `${BASE}/condiciones`,   changeFrequency: 'yearly', priority: 0.2, lastModified: now },
    { url: `${BASE}/terminos`,      changeFrequency: 'yearly', priority: 0.2, lastModified: now }
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((cat) => cat.slug !== 'holded')
    .map((cat) => ({
      url: `${BASE}/servicios/${cat.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
      lastModified: now
    }));

  const serviceRoutes: MetadataRoute.Sitemap = services
    .filter((service) => service.categoria !== 'formacion')
    .map((service) => ({
      url: `${BASE}/servicios/${service.categoria}/${service.slug}`,
      changeFrequency: 'monthly',
      priority: service.stripePriceId ? 0.85 : 0.7,
      lastModified: now
    }));

  const blogRoutes: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${BASE}/blog/${article.slug}`,
    changeFrequency: 'yearly',
    priority: 0.6,
    lastModified: parseArticleDate(article.date)
  }));

  const docRoutes: MetadataRoute.Sitemap = docs.map((doc) => ({
    url: `${BASE}/docs/${doc.slug}`,
    changeFrequency: 'monthly',
    priority: 0.75,
    lastModified: now
  }));

  return [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...docRoutes, ...blogRoutes];
}
