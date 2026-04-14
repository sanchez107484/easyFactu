import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ChevronLeft, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { ArticleBody } from '@/components/blog/ArticleBody';
import { sanityClient } from '@/sanity/lib/client';
import { POST_QUERY, POSTS_SLUGS_QUERY } from '@/sanity/lib/queries';
import type { SanityBlogPost, SanityPostSlug } from '@/sanity/lib/queries';
import { brandConfig } from '@easyfactura/brand-config';
import {
  formatBlogDate,
  estimateReadingTimeFromBody,
  extractWordCountFromBody,
} from '@/lib/blog-helpers';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<SanityBlogPost | null> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return null;
  }
  return sanityClient.fetch<SanityBlogPost | null>(
    POST_QUERY,
    { slug },
    { next: { revalidate: 3600, tags: ['sanity-blog'] } },
  );
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return [];
  }
  const slugs = await sanityClient.fetch<SanityPostSlug[]>(POSTS_SLUGS_QUERY);
  return slugs.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Artículo no encontrado' };
  }

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  const url = `${brandConfig.app.url}/blog/${post.slug}`;

  return {
    title: `${title} | ${brandConfig.app.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt ?? post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: post.featuredImageUrl
        ? [
            {
              url: post.featuredImageUrl,
              alt: post.featuredImageAlt ?? title,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
    },
  };
}

function ArticleJsonLd({ post }: { post: SanityBlogPost }) {
  const url = `${brandConfig.app.url}/blog/${post.slug}`;
  const wordCount = extractWordCountFromBody(
    post.body as Array<{ _type: string; children?: Array<{ text?: string }> }>,
  );

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    wordCount,
    articleSection: post.categories?.[0]?.title ?? undefined,
    author: post.author
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: brandConfig.app.name },
    publisher: {
      '@type': 'Organization',
      name: brandConfig.app.name,
      url: brandConfig.app.url,
    },
    image: post.featuredImageUrl
      ? {
          '@type': 'ImageObject',
          url: post.featuredImageUrl,
          description: post.featuredImageAlt ?? post.title,
        }
      : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: brandConfig.app.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${brandConfig.app.url}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const readingTime = estimateReadingTimeFromBody(
    post.body as Array<{ _type: string; children?: Array<{ text?: string }> }>,
  );

  return (
    <>
      <ArticleJsonLd post={post} />
      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* ── Hero image (full bleed) ── */}
        {post.featuredImageUrl && (
          <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-[420px]">
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt ?? post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        )}

        {/* ── Content wrapper ── */}
        <div className="container mx-auto max-w-6xl px-4">
          {/* Back link */}
          <div className={post.featuredImageUrl ? '-mt-8 relative z-10' : 'pt-10'}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al blog
            </Link>
          </div>

          {/* ── Two column: article + sidebar ── */}
          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
            {/* ── LEFT: Article ── */}
            <article>
              {/* Header */}
              <header className="mb-8">
                {(post.categories?.length ?? 0) > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {post.categories!.map((cat) => (
                      <Badge
                        key={cat.slug}
                        variant="secondary"
                        className="text-[11px] font-semibold tracking-wide uppercase"
                      >
                        {cat.title}
                      </Badge>
                    ))}
                  </div>
                )}

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl xl:text-5xl">
                  {post.title}
                </h1>

                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

                {/* Author + meta */}
                <div className="mt-6 flex flex-wrap items-center gap-4 border-b pb-6">
                  {post.author && (
                    <div className="flex items-center gap-2.5">
                      {post.author.imageUrl ? (
                        <Image
                          src={post.author.imageUrl}
                          alt={post.author.name}
                          width={36}
                          height={36}
                          className="rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground ml-auto">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatBlogDate(post.publishedAt)}
                    </span>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {readingTime} min de lectura
                    </span>
                  </div>
                </div>
              </header>

              {/* Body */}
              <ArticleBody body={post.body} />

              {/* CTA bottom */}
              <div className="mt-14 rounded-2xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15 p-8">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  {brandConfig.app.name}
                </p>
                <h2 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
                  Factura sin complicaciones
                </h2>
                <p className="mt-2 text-muted-foreground">
                  VeriFactu integrado, PDF automático y todo lo que necesitas como autónomo
                  —&nbsp;sin pagar por lo que no usas.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link href="/registro">
                    <Button size="lg" className="px-7 w-full sm:w-auto">
                      Probar gratis
                    </Button>
                  </Link>
                  <Link href="/precios">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Ver precios <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* ── RIGHT: Sticky sidebar ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* App promo card */}
                <div className="rounded-2xl border bg-card p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                    {brandConfig.app.name}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                    Facturación electrónica con VeriFactu para autónomos
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Cumple con Hacienda, emite facturas en segundos y olvídate del papeleo.
                  </p>
                  <Link href="/registro" className="mt-4 block">
                    <Button size="sm" className="w-full">
                      Empezar gratis
                    </Button>
                  </Link>
                </div>

                {/* Back to blog */}
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  Ver todos los artículos
                </Link>
              </div>
            </aside>
          </div>

          {/* Bottom padding */}
          <div className="pb-20" />
        </div>
      </main>

      <FooterLanding />
    </>
  );
}
