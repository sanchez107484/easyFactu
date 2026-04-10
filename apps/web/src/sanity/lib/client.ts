import { createClient } from 'next-sanity';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

export function fetchWithRevalidation<T>(
  query: string,
  params: Record<string, string> = {},
  revalidate = 3600,
): Promise<T> {
  // In development, never cache so changes appear immediately without restarting the server
  if (process.env.NODE_ENV === 'development') {
    return sanityClient.fetch<T>(query, params, { cache: 'no-store' });
  }
  return sanityClient.fetch<T>(query, params, {
    next: { revalidate, tags: ['sanity-blog'] },
  });
}
