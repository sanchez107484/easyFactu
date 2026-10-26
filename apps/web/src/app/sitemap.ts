import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { sanityClient } from '@/sanity/lib/client';
import { POSTS_FOR_SITEMAP_QUERY } from '@/sanity/lib/queries';
import type { SanityPostSitemap } from '@/sanity/lib/queries';
import { slugify } from '@/lib/slugify';
import { VERIFACTU_CALENDAR_UPDATED_AT } from '@/lib/verifactu-deadlines';

const BASE_URL = brandConfig.app.url;
const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

// Static dates — avoid regenerating "modified today" on every build
const UPDATED_RECENT = new Date('2026-05-19');
const UPDATED_STABLE = new Date('2025-06-01');
const UPDATED_VERIFACTU_CALENDAR = new Date(VERIFACTU_CALENDAR_UPDATED_AT.iso);
// Pages reworked in the October 2026 SEO sprint (HU-12 to HU-17)
const UPDATED_OCTOBER_2026 = new Date('2026-10-26');

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
  entry('/asesoria', 0.9),
  entry('/software-para-asesorias', 0.8),
  entry('/asesoria-facturas-clientes', 0.7),
  entry('/precios', 0.8, UPDATED_OCTOBER_2026),
  // /blog is added in sitemap() with its real lastmod (latest Sanity post).
  // Excluded on purpose: /login and /registro (noindex) and the legal pages
  // (crawlable via footer links, but not pages we want Google to prioritise).
];

// ── Brand-specific routes ────────────────────────────────────────────────────

const BRAND_ROUTES: Partial<Record<string, MetadataRoute.Sitemap>> = {
  novafactura: [
    entry('/contacto', 0.6, UPDATED_STABLE),
    entry('/facturacion-online', 0.9),
    entry('/factura-electronica', 0.85, UPDATED_OCTOBER_2026),
    entry('/factura-electronica/facturae', 0.7, UPDATED_OCTOBER_2026),
    entry('/factura-electronica/ejemplos', 0.7, UPDATED_OCTOBER_2026),
    // VeriFactu sub-pages
    entry('/verifactu/cuando-es-obligatorio', 0.8, UPDATED_VERIFACTU_CALENDAR),
    entry('/verifactu/sanciones', 0.75, UPDATED_VERIFACTU_CALENDAR),
    // Guías de facturas
    entry('/facturas', 0.8),
    entry('/facturas/como-hacer-una-factura', 0.75),
    entry('/facturas/con-irpf', 0.7),
    entry('/facturas/rectificativa', 0.7),
    entry('/facturas/proforma', 0.7),
    entry('/facturas/simplificada', 0.7),
    entry('/facturas/intracomunitaria', 0.7, UPDATED_OCTOBER_2026),
    entry('/facturacion-autonomo-agricola', 0.8, UPDATED_OCTOBER_2026),
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

async function fetchSitemapPosts(): Promise<SanityPostSitemap[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return [];
  try {
    return await sanityClient.fetch<SanityPostSitemap[]>(POSTS_FOR_SITEMAP_QUERY);
  } catch {
    // Sanity unavailable — sitemap falls back to static routes only
    return [];
  }
}

function postLastModified(post: SanityPostSitemap): Date {
  return new Date(post._updatedAt ?? post.publishedAt);
}

function blogIndexEntry(posts: SanityPostSitemap[]): SitemapEntry {
  // The index changes whenever a post is published or edited, so its lastmod
  // is the most recent post update — not a hardcoded date.
  const latestPostTime = Math.max(0, ...posts.map((post) => postLastModified(post).getTime()));
  const lastModified = latestPostTime > 0 ? new Date(latestPostTime) : UPDATED_RECENT;
  return entry('/blog', 0.8, lastModified, 'weekly');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [...SHARED_ROUTES, ...(BRAND_ROUTES[BRAND] ?? [])];
  const posts = await fetchSitemapPosts();

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    // Slugs are normalized to pure ASCII — URLs with raw diacritics
    // cause canonical/sitemap mismatches (percent-encoding duplicates).
    url: `${BASE_URL}/blog/${slugify(post.slug)}`,
    lastModified: postLastModified(post),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, blogIndexEntry(posts), ...blogRoutes];
}
