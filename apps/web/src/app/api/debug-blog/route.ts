import { NextResponse } from 'next/server';
import { sanityClient } from '@/sanity/lib/client';
import { groq } from 'next-sanity';

// Endpoint temporal de diagnóstico — eliminar en producción
export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  if (!projectId) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SANITY_PROJECT_ID no definido' },
      { status: 500 },
    );
  }

  // Query sin filtro de fecha para ver TODOS los documentos
  const allPosts = await sanityClient.fetch(groq`
    *[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      _createdAt,
      _updatedAt
    }
  `);

  // Query con filtro de fecha (la real)
  const publishedPosts = await sanityClient.fetch(groq`
    *[_type == "post" && defined(slug.current) && dateTime(publishedAt) <= dateTime(now())] {
      _id,
      title,
      "slug": slug.current,
      publishedAt
    }
  `);

  const now = new Date().toISOString();

  return NextResponse.json({
    projectId,
    now,
    totalDocuments: allPosts.length,
    allPosts,
    publishedPostsCount: publishedPosts.length,
    publishedPosts,
  });
}
