import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { sanityClient } from '@/sanity/lib/client';
import { POSTS_FOR_SITEMAP_QUERY } from '@/sanity/lib/queries';
import type { SanityPostSitemap } from '@/sanity/lib/queries';

const BASE_URL = brandConfig.app.url;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/registro`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/verifactu`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/precios`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/asesoria`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funcionalidades`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    // Legal pages — low priority but important for E-E-A-T trust signals
    { url: `${BASE_URL}/aviso-legal`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${BASE_URL}/politica-privacidad`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${BASE_URL}/terminos-uso`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${BASE_URL}/tratamiento-datos`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];

  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    try {
      const posts = await sanityClient.fetch<SanityPostSitemap[]>(POSTS_FOR_SITEMAP_QUERY);
      blogRoutes = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt ?? post.publishedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } catch {
      // Si Sanity no está disponible, el sitemap solo incluye rutas estáticas
    }
  }

  return [...staticRoutes, ...blogRoutes];
}
