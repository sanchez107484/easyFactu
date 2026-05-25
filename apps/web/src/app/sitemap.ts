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

// ── Helper ──────────────────────────────────────────────────────────────────

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFreq = SitemapEntry['changeFrequency'];

function entry(
  path: string,
  priority: number,
  lastModified: Date = UPDATED_RECENT,
  changeFrequency: ChangeFreq = 'monthly',
): SitemapEntry {
  return { url: `${BASE_URL}${path}`, lastModified, changeFrequency, priority };
}

// ── Shared routes (all brands) ───────────────────────────────────────────────

const SHARED_ROUTES: MetadataRoute.Sitemap = [
  entry('/', 1.0, UPDATED_RECENT, 'weekly'),
  entry('/funcionalidades', 0.8),
  entry('/verifactu', 0.9),
  entry('/asesoria', 0.8),
  entry('/precios', 0.8, UPDATED_STABLE),
  entry('/blog', 0.8, UPDATED_RECENT, 'weekly'),
  entry('/registro', 0.5, UPDATED_STABLE),
  // Legal — low priority but important for E-E-A-T trust signals
  entry('/aviso-legal', 0.3, UPDATED_LEGAL, 'yearly'),
  entry('/politica-privacidad', 0.3, UPDATED_LEGAL, 'yearly'),
  entry('/terminos-uso', 0.3, UPDATED_LEGAL, 'yearly'),
  entry('/cookies', 0.3, UPDATED_LEGAL, 'yearly'),
  entry('/tratamiento-datos', 0.3, UPDATED_LEGAL, 'yearly'),
];

// ── Brand-specific routes ────────────────────────────────────────────────────

const BRAND_ROUTES: Partial<Record<string, MetadataRoute.Sitemap>> = {
  novafactura: [
    entry('/contacto', 0.6, UPDATED_STABLE),
    entry('/facturacion-online', 0.9),
    entry('/factura-electronica', 0.85),
    // VeriFactu sub-pages
    entry('/verifactu/cuando-es-obligatorio', 0.8),
    entry('/verifactu/software-garante', 0.8),
    entry('/verifactu/sanciones', 0.75),
    // Guías de facturas
    entry('/facturas', 0.8),
    entry('/facturas/como-hacer-una-factura', 0.75),
    entry('/facturas/con-irpf', 0.7),
    entry('/facturas/rectificativa', 0.7),
    entry('/facturas/proforma', 0.7),
    entry('/facturas/simplificada', 0.7),
    entry('/facturas/intracomunitaria', 0.7),
    entry('/facturacion-autonomo-agricola', 0.8),
  ],
  nafactura: [
    entry('/contacto', 0.6, UPDATED_STABLE),
    entry('/naticket', 0.95),
    entry('/alternativa-holded-navarra', 0.8),
    entry('/mejor-software-facturacion-navarra', 0.8),
    entry('/software-facturacion-pamplona', 0.75),
    entry('/facturacion-autonomo-agricola', 0.8),
  ],
};

// ── Sitemap function ─────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [...SHARED_ROUTES, ...(BRAND_ROUTES[BRAND] ?? [])];

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
      // Sanity unavailable — sitemap falls back to static routes only
    }
  }

  return [...staticRoutes, ...blogRoutes];
}
