import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/auth/', '/api/', '/gracias/']
      }
    ],
    sitemap: 'https://expertconsulting.es/sitemap.xml'
  };
}
