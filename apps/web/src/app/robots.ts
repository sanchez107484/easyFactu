import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/invoice-print/',
          '/setup/',
          '/login',
          '/recuperar-password',
          '/nueva-password',
          '/verificar-email',
          '/studio/',
        ],
      },
    ],
    sitemap: `${brandConfig.app.url}/sitemap.xml`,
    host: brandConfig.app.url,
  };
}
