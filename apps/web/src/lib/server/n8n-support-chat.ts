import { z } from 'zod';

const N8N_TIMEOUT_MS = 55_000;

const n8nReplySchema = z.object({
  respuesta: z.string().trim().min(1),
});

export type SupportChatResult =
  | { status: 'answered'; respuesta: string }
  | { status: 'not_configured' }
  | { status: 'timeout' }
  | { status: 'failed' };

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

async function parseReply(response: Response): Promise<SupportChatResult> {
  if (!response.ok) return { status: 'failed' };

  const reply = n8nReplySchema.safeParse(await response.json());
  return reply.success
    ? { status: 'answered', respuesta: reply.data.respuesta }
    : { status: 'failed' };
}

export async function askSupportAssistant(message: string): Promise<SupportChatResult> {
  const webhookUrl = process.env.N8N_SUPPORT_CHAT_WEBHOOK_URL;
  if (!webhookUrl) return { status: 'not_configured' };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });
    return await parseReply(response);
  } catch (error: unknown) {
    return { status: isTimeout(error) ? 'timeout' : 'failed' };
  }
}
