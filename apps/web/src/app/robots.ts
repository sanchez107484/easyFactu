import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloquear rutas privadas (dashboard y rutas de impresión)
        disallow: ['/dashboard/', '/invoice-print/'],
      },
    ],
    sitemap: `${brandConfig.app.url}/sitemap.xml`,
    host: brandConfig.app.url,
  };
}
