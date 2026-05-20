import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { sanityClient } from '@/sanity/lib/client';
import { POSTS_FOR_SITEMAP_QUERY } from '@/sanity/lib/queries';
import type { SanityPostSitemap } from '@/sanity/lib/queries';

const BASE_URL = brandConfig.app.url;
const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

// Static dates — avoid regenerating "modified today" on every build
const UPDATED_RECENT = new Date('2026-05-19');
const UPDATED_STABLE = new Date('2025-06-01');
const UPDATED_LEGAL = new Date('2025-04-01');

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes shared by all brands
  const sharedRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: UPDATED_RECENT, changeFrequency: 'weekly', priority: 1.0 },
    {
      url: `${BASE_URL}/funcionalidades`,
      lastModified: UPDATED_RECENT,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/verifactu`,
      lastModified: UPDATED_RECENT,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/asesoria`,
      lastModified: UPDATED_STABLE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/precios`,
      lastModified: UPDATED_STABLE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: UPDATED_RECENT,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/registro`,
      lastModified: UPDATED_STABLE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Legal pages — low priority but important for E-E-A-T trust signals
    {
      url: `${BASE_URL}/aviso-legal`,
      lastModified: UPDATED_LEGAL,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/politica-privacidad`,
      lastModified: UPDATED_LEGAL,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terminos-uso`,
      lastModified: UPDATED_LEGAL,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: UPDATED_LEGAL,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/tratamiento-datos`,
      lastModified: UPDATED_LEGAL,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Routes exclusive to NovaFactura
  const novafacturaRoutes: MetadataRoute.Sitemap =
    BRAND === 'novafactura'
      ? [
          {
            url: `${BASE_URL}/contacto`,
            lastModified: UPDATED_STABLE,
            changeFrequency: 'monthly',
            priority: 0.6,
          },
          {
            url: `${BASE_URL}/facturacion-online`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.9,
          },
          {
            url: `${BASE_URL}/factura-electronica`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.85,
          },
          // VeriFactu sub-pages
          {
            url: `${BASE_URL}/verifactu/cuando-es-obligatorio`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.8,
          },
          {
            url: `${BASE_URL}/verifactu/software-garante`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.8,
          },
          {
            url: `${BASE_URL}/verifactu/sanciones`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.75,
          },
          // Guías de facturas
          {
            url: `${BASE_URL}/facturas`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.8,
          },
          {
            url: `${BASE_URL}/facturas/como-hacer-una-factura`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.75,
          },
          {
            url: `${BASE_URL}/facturas/con-irpf`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/facturas/rectificativa`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/facturas/proforma`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/facturas/simplificada`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/facturas/intracomunitaria`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.7,
          },
        ]
      : [];

  // Routes exclusive to NaFactura
  const nafacturaRoutes: MetadataRoute.Sitemap =
    BRAND === 'nafactura'
      ? [
          {
            url: `${BASE_URL}/naticket`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.95,
          },
          {
            url: `${BASE_URL}/alternativa-holded-navarra`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.8,
          },
          {
            url: `${BASE_URL}/mejor-software-facturacion-navarra`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.8,
          },
          {
            url: `${BASE_URL}/software-facturacion-pamplona`,
            lastModified: UPDATED_RECENT,
            changeFrequency: 'monthly',
            priority: 0.75,
          },
        ]
      : [];

  const staticRoutes = [...sharedRoutes, ...novafacturaRoutes, ...nafacturaRoutes];

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
