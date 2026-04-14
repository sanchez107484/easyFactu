import { groq } from 'next-sanity';
import type { PortableTextBlock } from '@portabletext/react';

export interface SanityBlogAuthor {
  name: string;
  imageUrl: string | null;
}

export interface SanityBlogCategory {
  title: string;
  slug: string;
}

export interface SanityBlogPostCard {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author: SanityBlogAuthor | null;
  categories: SanityBlogCategory[] | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
}

export interface SanityBlogPost extends SanityBlogPostCard {
  _updatedAt: string;
  body: PortableTextBlock[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export const POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current) && dateTime(publishedAt) <= dateTime(now())]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    "author": author->{ name, "imageUrl": image.asset->url },
    "categories": categories[]->{ title, "slug": slug.current },
    "featuredImageUrl": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt
  }
`;

export const POST_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    body,
    publishedAt,
    "author": author->{ name, "imageUrl": image.asset->url },
    "categories": categories[]->{ title, "slug": slug.current },
    "featuredImageUrl": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    _updatedAt,
    seoTitle,
    seoDescription
  }
`;

export const POSTS_SLUGS_QUERY = groq`
  *[_type == "post" && defined(slug.current) && dateTime(publishedAt) <= dateTime(now())]
  { "slug": slug.current }
`;

export const POSTS_FOR_SITEMAP_QUERY = groq`
  *[_type == "post" && defined(slug.current) && dateTime(publishedAt) <= dateTime(now())]
  | order(publishedAt desc) {
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }
`;

export interface SanityPostSlug {
  slug: string;
}

export interface SanityPostSitemap {
  slug: string;
  publishedAt: string;
  _updatedAt: string;
}
