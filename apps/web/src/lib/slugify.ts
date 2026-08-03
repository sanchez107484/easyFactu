/**
 * Converts a string into a URL-safe ASCII slug.
 *
 * Strips diacritics (á → a, ñ → n, ü → u), lowercases, and replaces any
 * non-alphanumeric run with a single hyphen. URLs must be pure ASCII —
 * an unencoded character causes mismatches between internal links,
 * canonicals and the sitemap (percent-encoding), which Google treats
 * as duplicate URLs.
 *
 * Idempotent: slugify(slugify(x)) === slugify(x).
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
