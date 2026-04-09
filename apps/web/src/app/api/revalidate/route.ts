import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

function isValidSignature(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const digest = Buffer.from(`sha256=${hmac.digest('hex')}`);
  const checksum = Buffer.from(signature);

  if (digest.length !== checksum.length) {
    return false;
  }

  return timingSafeEqual(digest, checksum);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Sanity sends the signature in the `sanity-webhook-signature` header
  const signature = request.headers.get('sanity-webhook-signature') ?? '';
  const body = await request.text();

  if (!isValidSignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: { _type?: string; slug?: { current?: string } };
  try {
    payload = JSON.parse(body) as { _type?: string; slug?: { current?: string } };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only handle post documents
  if (payload._type !== 'post') {
    return NextResponse.json({ skipped: true, reason: 'Not a post document' });
  }

  // Revalidate the blog listing and the specific post
  revalidateTag('sanity-blog');
  revalidatePath('/blog');

  const slug = payload.slug?.current;
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }

  return NextResponse.json({ revalidated: true, slug: slug ?? null });
}
