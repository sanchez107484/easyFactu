import { sanityClient } from '@/sanity/lib/client';
import { POSTS_QUERY } from '@/sanity/lib/queries';
import type { SanityBlogPostCard } from '@/sanity/lib/queries';
import { slugify } from '@/lib/slugify';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

const BRAND_INFO = {
  novafactura: {
    title: 'NovaFactura — Software de facturación VeriFactu',
    description:
      'Software de facturación para autónomos y pymes. VeriFactu automático, envío a AEAT, exportación contable. Gratis hasta 2027.',
    siteUrl: 'https://novafactura.es',
    feedUrl: 'https://novafactura.es/feed.xml',
    language: 'es-ES',
  },
  nafactura: {
    title: 'NaFactura — Software de facturación Navarra',
    description:
      'Software de facturación para autónomos navarros. NaTicket automático, exportación CSV/PDF, cumplimiento con Hacienda Foral. Gratis hasta 2027.',
    siteUrl: 'https://nafactura.es',
    feedUrl: 'https://nafactura.es/feed.xml',
    language: 'es-ES',
  },
} as const;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRfc822Date(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toUTCString();
}

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const info = BRAND_INFO[BRAND as keyof typeof BRAND_INFO] ?? BRAND_INFO.novafactura;

  let posts: SanityBlogPostCard[] = [];

  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    try {
      posts = await sanityClient.fetch<SanityBlogPostCard[]>(POSTS_QUERY, {}, { next: { revalidate: 3600 } });
    } catch {
      // Sanity unavailable — return empty feed
    }
  }

  const itemsXml = posts
    .map((post) => {
      const url = `${info.siteUrl}/blog/${slugify(post.slug)}`;
      const pubDate = post.publishedAt ? formatRfc822Date(post.publishedAt) : new Date().toUTCString();
      const author = post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : '';
      const categories =
        post.categories?.map((c) => `<category>${escapeXml(c.title)}</category>`).join('') ?? '';

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${author}
      ${categories}
      <description><![CDATA[${post.excerpt ?? ''}]]></description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(info.title)}</title>
    <link>${info.siteUrl}</link>
    <atom:link href="${info.feedUrl}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(info.description)}</description>
    <language>${info.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>info@novafactura.es (NovaFactura)</managingEditor>
    <webMaster>info@novafactura.es (NovaFactura)</webMaster>
    <ttl>60</ttl>
    <image>
      <url>${info.siteUrl}/og-image.png</url>
      <title>${escapeXml(info.title)}</title>
      <link>${info.siteUrl}</link>
    </image>${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}