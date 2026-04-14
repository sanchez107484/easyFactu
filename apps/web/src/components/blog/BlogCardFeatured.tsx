import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatBlogDate, estimateReadingTime } from '@/lib/blog-helpers';
import type { SanityBlogPostCard } from '@/sanity/lib/queries';

interface BlogCardFeaturedProps {
  post: SanityBlogPostCard;
}

export function BlogCardFeatured({ post }: BlogCardFeaturedProps) {
  const readingTime = estimateReadingTime(post.excerpt);

  return (
    <article className="group grid overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-xl lg:grid-cols-[1fr_45%]">
      {/* Image */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative block overflow-hidden bg-muted lg:order-last"
        tabIndex={-1}
      >
        <div className="aspect-[16/9] lg:aspect-auto lg:h-full">
          {post.featuredImageUrl ? (
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt ?? post.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-primary/15 via-primary/8 to-muted">
              <span className="text-8xl font-black text-primary/20 select-none">
                {post.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col justify-center p-7 lg:p-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            Artículo destacado
          </Badge>
          {(post.categories?.length ?? 0) > 0 &&
            post.categories!.map((cat) => (
              <Badge
                key={cat.slug}
                variant="secondary"
                className="text-[11px] font-semibold tracking-wide uppercase"
              >
                {cat.title}
              </Badge>
            ))}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.imageUrl ? (
                <Image
                  src={post.author.imageUrl}
                  alt={post.author.name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted" />
              )}
              <span className="text-sm font-medium text-foreground">{post.author.name}</span>
            </div>
          )}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatBlogDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} min de lectura
          </span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-gap hover:gap-3"
        >
          Leer artículo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
