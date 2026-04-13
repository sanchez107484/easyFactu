import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ChevronLeft, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { ArticleBody } from '@/components/blog/ArticleBody';
import { sanityClient } from '@/sanity/lib/client';
import { POST_QUERY, POSTS_SLUGS_QUERY } from '@/sanity/lib/queries';
import type { SanityBlogPost, SanityPostSlug } from '@/sanity/lib/queries';
import { brandConfig } from '@easyfactura/brand-config';
import { formatBlogDate, estimateReadingTimeFromBody } from '@/lib/blog-helpers';

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt,
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
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

      <main className="min-h-screen">
        {/* Hero con imagen destacada */}
        {post.featuredImageUrl && (
          <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt ?? post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-4 py-10">
          {/* Migas de pan */}
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al blog
          </Link>

          {/* Cabecera del artículo */}
          <header className="mb-10">
            {(post.categories?.length ?? 0) > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.categories!.map((cat) => (
                  <Badge key={cat.slug} variant="secondary" className="text-xs font-medium">
                    {cat.title}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {post.author && (
                <span className="flex items-center gap-1.5">
                  {post.author.imageUrl ? (
                    <Image
                      src={post.author.imageUrl}
                      alt={post.author.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {post.author.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatBlogDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min de lectura
              </span>
            </div>
          </header>

          {/* Separador */}
          <div className="mb-10 border-t" />

          {/* Cuerpo del artículo */}
          <ArticleBody body={post.body} />

          {/* CTA al final del artículo */}
          <div className="mt-14 rounded-2xl border bg-muted/40 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {brandConfig.app.name}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Factura sin complicaciones</h2>
            <p className="mt-3 text-muted-foreground">
              VeriFactu integrado, PDF automático y todo lo que necesitas como autónomo — sin pagar
              por funcionalidades que no usas.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/registro">
                <Button size="lg" className="px-8">
                  Probar gratis
                </Button>
              </Link>
              <Link href="/precios">
                <Button variant="ghost" size="lg">
                  Ver precios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterLanding />
    </>
  );
}
