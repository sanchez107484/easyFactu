import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCardFeatured } from '@/components/blog/BlogCardFeatured';
import { fetchWithRevalidation } from '@/sanity/lib/client';
import { POSTS_QUERY } from '@/sanity/lib/queries';
import type { SanityBlogPostCard } from '@/sanity/lib/queries';
import { slugify } from '@/lib/slugify';
import { brandConfig } from '@easyfactura/brand-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Blog — Facturación y VeriFactu | ${brandConfig.app.name}`,
  description:
    'Artículos sobre facturación electrónica, VeriFactu, impuestos para autónomos y novedades de la AEAT. Todo lo que necesitas saber para gestionar tu negocio.',
  alternates: {
    canonical: `${brandConfig.app.url}/blog`,
  },
  openGraph: {
    title: `Blog — ${brandConfig.app.name}`,
    description: 'Recursos sobre facturación electrónica, VeriFactu y fiscalidad para autónomos.',
    url: `${brandConfig.app.url}/blog`,
    type: 'website',
  },
};

async function getPosts(): Promise<SanityBlogPostCard[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return [];
  }
  return fetchWithRevalidation<SanityBlogPostCard[]>(POSTS_QUERY);
}

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: `Blog — ${brandConfig.app.name}`,
  description:
    'Artículos sobre facturación electrónica, VeriFactu, impuestos para autónomos y novedades de la AEAT.',
  url: `${brandConfig.app.url}/blog`,
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${brandConfig.app.url}/blog` },
  ],
};

export default async function BlogPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  // ItemList schema — lists all blog posts for Google's carousel/rich snippets.
  // Only rendered when posts exist to avoid empty arrays confusing crawlers.
  const itemListJsonLd =
    posts.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Blog — ${brandConfig.app.name}`,
          url: `${brandConfig.app.url}/blog`,
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${brandConfig.app.url}/blog/${slugify(post.slug)}`,
            name: post.title,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="relative container mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              El blog de {brandConfig.app.name}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Todo lo que necesitas
              <br className="hidden sm:block" /> saber como autónomo
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Facturación electrónica, VeriFactu, deducciones fiscales y guías prácticas. Sin
              tecnicismos. Sin rodeos.
            </p>
          </div>
        </section>

        {posts.length === 0 ? (
          <section className="container mx-auto max-w-6xl px-4 py-32 text-center">
            <p className="text-xl font-medium text-foreground">Próximamente</p>
            <p className="mt-2 text-muted-foreground">
              Estamos preparando contenido útil para ti. ¡Vuelve pronto!
            </p>
          </section>
        ) : (
          <>
            {/* ── Artículo destacado ── */}
            {featured && (
              <section className="container mx-auto max-w-6xl px-4 py-12">
                <BlogCardFeatured post={featured} />
              </section>
            )}

            {/* ── Resto de artículos ── */}
            {rest.length > 0 && (
              <section className="container mx-auto max-w-6xl px-4 pb-20">
                <div className="mb-8 flex items-center justify-between border-b pb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Más artículos
                  </h2>
                  <Link
                    href="/blog"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogCard key={post._id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <FooterLanding />
    </>
  );
}
