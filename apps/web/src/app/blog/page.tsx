import type { Metadata } from 'next';
import { Rss } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { BlogCard } from '@/components/blog/BlogCard';
import { sanityClient, fetchWithRevalidation } from '@/sanity/lib/client';
import { POSTS_QUERY } from '@/sanity/lib/queries';
import type { SanityBlogPostCard } from '@/sanity/lib/queries';
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

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-14">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Rss className="h-4 w-4" />
              <span>Blog</span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Recursos para autónomos
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Artículos sobre facturación electrónica, VeriFactu, impuestos y todo lo que necesitas
              para gestionar tu negocio con tranquilidad.
            </p>
          </div>
        </section>

        {/* Artículos */}
        <section className="container mx-auto max-w-6xl px-4 py-14">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Próximamente nuevos artículos
              </p>
              <p className="text-sm text-muted-foreground">
                Estamos preparando contenido útil para ti. ¡Vuelve pronto!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>

      <FooterLanding />
    </>
  );
}
