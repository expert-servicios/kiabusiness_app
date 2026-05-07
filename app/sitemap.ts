import type { MetadataRoute } from 'next';
import { categories } from '@/lib/utils/catalog';
import { articles } from '@/lib/utils/blog';

const BASE = 'https://kseniailicheva.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/servicios`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/planes`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/holded`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/sobre-mi`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/contacto`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE}/solicitar-presupuesto`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE}/para-asesorias`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/planes/basico`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/planes/estandar`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/planes/premium`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/aviso-legal`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/condiciones`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terminos`, changeFrequency: 'yearly', priority: 0.2 }
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE}/servicios/${cat.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8
  }));

  const blogRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE}/blog/${article.slug}`,
    changeFrequency: 'yearly',
    priority: 0.6
  }));

  return [...staticRoutes, ...categoryRoutes, ...blogRoutes];
}
