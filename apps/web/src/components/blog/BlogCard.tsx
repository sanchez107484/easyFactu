import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatBlogDate, estimateReadingTime } from '@/lib/blog-helpers';
import type { SanityBlogPostCard } from '@/sanity/lib/queries';

interface BlogCardProps {
  post: SanityBlogPostCard;
}

export function BlogCard({ post }: BlogCardProps) {
  const readingTime = estimateReadingTime(post.excerpt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden" tabIndex={-1}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {post.featuredImageUrl ? (
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt ?? post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/8 to-muted">
              <span className="text-5xl font-black text-primary/20 select-none">
                {post.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {(post.categories?.length ?? 0) > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
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

        <Link href={`/blog/${post.slug}`} className="flex-1 group/title">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover/title:text-primary">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}
        </Link>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          {post.author?.imageUrl ? (
            <Image
              src={post.author.imageUrl}
              alt={post.author.name}
              width={20}
              height={20}
              className="rounded-full object-cover ring-1 ring-border"
            />
          ) : null}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {formatBlogDate(post.publishedAt)}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {readingTime} min
          </span>
        </div>
      </div>
    </article>
  );
}
