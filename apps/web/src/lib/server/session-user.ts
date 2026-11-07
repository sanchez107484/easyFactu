import { z } from 'zod';

const SESSION_CHECK_TIMEOUT_MS = 5_000;

const sessionResponseSchema = z.object({
  data: z.object({ id: z.string().min(1) }),
});

export type SessionUserResult =
  | { status: 'authenticated'; userId: string }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' };

function currentUserUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return `${apiBase.replace(/\/v1$/, '')}/v1/auth/me`;
}

/** The NestJS API is the only holder of the JWT secret, so it decides whether a token is valid. */
export async function resolveSessionUser(authorization: string | null): Promise<SessionUserResult> {
  if (!authorization?.startsWith('Bearer ')) return { status: 'unauthenticated' };

  try {
    const response = await fetch(currentUserUrl(), {
      headers: { authorization },
      cache: 'no-store',
      signal: AbortSignal.timeout(SESSION_CHECK_TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) return { status: 'unauthenticated' };
    if (!response.ok) return { status: 'unavailable' };

    const session = sessionResponseSchema.safeParse(await response.json());
    return session.success
      ? { status: 'authenticated', userId: session.data.data.id }
      : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
