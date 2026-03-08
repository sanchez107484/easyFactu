import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

const BASE_URL = brandConfig.app.url;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Rutas públicas (no requieren autenticación)
  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/registro`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/recuperar-password`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
