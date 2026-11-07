import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HELP_CHAT_MAX_MESSAGE_LENGTH, isHelpChatEnabled } from '@/lib/help-chat-config';
import { askSupportAssistant, type SupportChatResult } from '@/lib/server/n8n-support-chat';
import { createRateLimiter, type RateLimitResult } from '@/lib/server/rate-limiter';
import { resolveSessionUser } from '@/lib/server/session-user';

export const runtime = 'nodejs';

// Covers the session check plus the n8n timeout, so the handler reports failures itself.
export const maxDuration = 60;

const ONE_MINUTE_MS = 60_000;
const MAX_BODY_CHARACTERS = 16_000;
const UNAVAILABLE_MESSAGE =
  'El asistente no está disponible en este momento. Inténtalo de nuevo en unos minutos.';

const consumeIpQuota = createRateLimiter({ limit: 30, windowMs: ONE_MINUTE_MS });
const consumeUserQuota = createRateLimiter({ limit: 10, windowMs: ONE_MINUTE_MS });

const chatRequestSchema = z
  .object({ message: z.string().trim().min(1).max(HELP_CHAT_MAX_MESSAGE_LENGTH) })
  .strict();

function errorResponse(status: number, message: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ message }, { status, headers });
}

function tooManyRequests({ retryAfterSeconds }: RateLimitResult): NextResponse {
  return errorResponse(
    429,
    'Has enviado demasiados mensajes. Espera un momento antes de volver a intentarlo.',
    { 'retry-after': String(retryAfterSeconds) },
  );
}

/** Vercel sets both headers itself, so a client cannot spoof them in production. */
function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') ?? forwardedFor ?? 'unknown';
}

async function readMessage(request: NextRequest): Promise<string | null> {
  const body = await request.text();
  if (body.length > MAX_BODY_CHARACTERS) return null;

  try {
    const parsed = chatRequestSchema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data.message : null;
  } catch {
    return null;
  }
}

function assistantResponse(result: SupportChatResult): NextResponse {
  switch (result.status) {
    case 'answered':
      return NextResponse.json({ respuesta: result.respuesta });
    case 'timeout':
      console.error('[chat-soporte] n8n timed out');
      return errorResponse(
        504,
        'El asistente está tardando demasiado en responder. Inténtalo de nuevo.',
      );
    case 'not_configured':
      console.error('[chat-soporte] N8N_SUPPORT_CHAT_WEBHOOK_URL is not set');
      return errorResponse(503, UNAVAILABLE_MESSAGE);
    case 'failed':
      console.error('[chat-soporte] n8n request failed or returned an invalid reply');
      return errorResponse(502, UNAVAILABLE_MESSAGE);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isHelpChatEnabled) return errorResponse(404, 'No encontrado');

  const ipQuota = consumeIpQuota(clientIp(request));
  if (!ipQuota.isAllowed) return tooManyRequests(ipQuota);

  const session = await resolveSessionUser(request.headers.get('authorization'));
  if (session.status === 'unauthenticated') return errorResponse(401, 'No autorizado');
  if (session.status === 'unavailable') return errorResponse(503, UNAVAILABLE_MESSAGE);

  const userQuota = consumeUserQuota(session.userId);
  if (!userQuota.isAllowed) return tooManyRequests(userQuota);

  const message = await readMessage(request);
  if (message === null) {
    return errorResponse(
      400,
      `Escribe un mensaje de entre 1 y ${HELP_CHAT_MAX_MESSAGE_LENGTH} caracteres.`,
    );
  }

  return assistantResponse(await askSupportAssistant(message));
}
