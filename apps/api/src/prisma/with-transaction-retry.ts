import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const logger = new Logger('TransactionRetry');

/**
 * Transient Prisma errors where re-executing the whole operation can succeed.
 * Everything else (validation errors, not-found, conflicts, unique/FK violations)
 * is deterministic — retrying would only add latency and fail identically.
 */
const RETRYABLE_ERROR_CODES = new Set([
  'P1001', // Cannot reach database server
  'P1002', // Database server timed out
  'P1017', // Server closed the connection
  'P2024', // Timed out fetching a connection from the pool
  'P2028', // Transaction API error (e.g. transaction closed after stalling)
  'P2034', // Write conflict / deadlock — Prisma officially recommends retrying
]);

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an operation with bounded retries on transient database errors.
 *
 * Only wrap units of work that are fully atomic — a complete Prisma transaction
 * or a single query. An interactive transaction either commits or rolls back as
 * a whole, so re-running it never duplicates partial work and the retry stays
 * invisible to the user. The happy path is unaffected: no retry, no delay.
 * Every retry is logged so recurring transient failures remain visible to us.
 */
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const code =
        error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'unknown';
      if (!RETRYABLE_ERROR_CODES.has(code) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      const delayMs = 2 ** (attempt - 1) * BASE_DELAY_MS + Math.random() * BASE_DELAY_MS;
      logger.warn(
        `${context}: transient error ${code}, retrying (${attempt + 1}/${MAX_ATTEMPTS}) in ${Math.round(delayMs)}ms`
      );
      await sleep(delayMs);
    }
  }
}
