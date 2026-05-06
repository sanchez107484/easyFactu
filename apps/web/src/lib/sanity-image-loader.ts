/**
 * Custom Next.js image loader for Sanity CDN images.
 *
 * Sanity's image CDN supports the same resize/quality transformations as
 * Vercel's /_next/image but is completely free. By routing Sanity images
 * through this loader we avoid hitting Vercel's paid image optimization quota.
 *
 * For non-Sanity URLs (e.g. local uploads) we return the src as-is.
 */

interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function sanityImageLoader({ src, width, quality }: LoaderParams): string {
  if (!src.startsWith('https://cdn.sanity.io')) {
    // Non-Sanity assets (e.g. logo uploads served from the API) don't need
    // Sanity-specific transforms — return unmodified.
    return src;
  }

  const url = new URL(src);
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality ?? 75));
  // Let Sanity's CDN pick the best format (WebP / AVIF) automatically.
  url.searchParams.set('auto', 'format');
  // Resize to fit within the requested width without upscaling.
  url.searchParams.set('fit', 'max');

  return url.toString();
}
