import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatBlogDate(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
}

/**
 * Estimates reading time based on plain text length.
 * Uses ~200 words per minute as a conservative reading speed.
 */
export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Estimates reading time from Portable Text body blocks word count.
 */
export function estimateReadingTimeFromBody(
  body: Array<{ _type: string; children?: Array<{ text?: string }> }>,
): number {
  const wordCount = body
    .filter((block) => block._type === 'block' && Array.isArray(block.children))
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}
