import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IdempotencyRecord, IdempotencyStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { IDEMPOTENCY_LOCK_MS, IDEMPOTENCY_TTL_MS } from '../integrations.constants';

export interface IdempotencyContext {
  scope: string;
  key: string;
  requestHash: string;
}

export interface OperationResult {
  status: number;
  body: object;
}

export interface IdempotentOutcome extends OperationResult {
  replayed: boolean;
}

/** Secrets never stored for replay: a retried key request gets `apiKey: null` and must ask for a new key. */
const NON_REPLAYABLE_FIELDS = ['apiKey'];

function toStoredBody(body: object): Prisma.InputJsonValue {
  const stored: Record<string, unknown> = { ...body };
  for (const field of NON_REPLAYABLE_FIELDS) if (field in stored) stored[field] = null;
  return JSON.parse(JSON.stringify(stored)) as Prisma.InputJsonValue;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * Idempotency-Key handling (contract): same key + same request → same response;
 * same key + other request → IDEMPOTENCY_CONFLICT; same key while the first request is
 * still running → REQUEST_IN_PROGRESS. Records expire after 30 days.
 * A failed operation releases its key so the integrator can retry with it.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    context: IdempotencyContext,
    operation: () => Promise<OperationResult>
  ): Promise<IdempotentOutcome> {
    const replay = await this.acquire(context);
    if (replay) return replay;

    let result: OperationResult;
    try {
      result = await operation();
    } catch (error) {
      await this.release(context);
      throw error;
    }
    await this.complete(context, result);
    return { ...result, replayed: false };
  }

  /** Removes expired records. Runs daily on long-lived servers; serverless relies on lazy expiry. */
  @Cron('30 3 * * *', { name: 'purge-idempotency-records' })
  async purgeExpired(): Promise<void> {
    const { count } = await this.prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Purged ${count} expired idempotency records`);
  }

  /** Returns the stored outcome to replay, or null when this request owns the key and must run. */
  private async acquire(
    context: IdempotencyContext,
    isRetry = false
  ): Promise<IdempotentOutcome | null> {
    try {
      await this.createInProgress(context);
      return null;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }

    const existing = await this.findRecord(context);
    if (!existing) return isRetry ? this.inProgress() : this.acquire(context, true);
    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.prisma.idempotencyRecord.deleteMany({
        where: { id: existing.id, expiresAt: { lte: new Date() } },
      });
      return isRetry ? this.inProgress() : this.acquire(context, true);
    }
    return this.resolveExisting(context, existing);
  }

  private async resolveExisting(
    context: IdempotencyContext,
    record: IdempotencyRecord
  ): Promise<IdempotentOutcome | null> {
    if (record.requestHash !== context.requestHash) {
      throw new IntegrationException(
        IntegrationErrorCode.IDEMPOTENCY_CONFLICT,
        'Esta Idempotency-Key ya se usó con otra petición. Usa una clave nueva para una operación distinta.'
      );
    }
    if (record.status === IdempotencyStatus.COMPLETED) {
      return {
        status: record.responseStatus ?? 200,
        body: (record.responseBody ?? {}) as object,
        replayed: true,
      };
    }
    if (record.lockedUntil.getTime() > Date.now()) return this.inProgress();
    return (await this.takeOverStaleLock(record)) ? null : this.inProgress();
  }

  /** A request that died mid-flight leaves IN_PROGRESS behind; the next retry takes it over once. */
  private async takeOverStaleLock(record: IdempotencyRecord): Promise<boolean> {
    const { count } = await this.prisma.idempotencyRecord.updateMany({
      where: {
        id: record.id,
        status: IdempotencyStatus.IN_PROGRESS,
        lockedUntil: { lte: new Date() },
      },
      data: { lockedUntil: new Date(Date.now() + IDEMPOTENCY_LOCK_MS) },
    });
    return count === 1;
  }

  private inProgress(): never {
    throw new IntegrationException(
      IntegrationErrorCode.REQUEST_IN_PROGRESS,
      'Esta Idempotency-Key se está procesando. Reintenta en unos segundos con la misma clave.',
      { retryAfterSeconds: 2 }
    );
  }

  private createInProgress(context: IdempotencyContext): Promise<IdempotencyRecord> {
    const now = Date.now();
    return this.prisma.idempotencyRecord.create({
      data: {
        scope: context.scope,
        idempotencyKey: context.key,
        requestHash: context.requestHash,
        status: IdempotencyStatus.IN_PROGRESS,
        lockedUntil: new Date(now + IDEMPOTENCY_LOCK_MS),
        expiresAt: new Date(now + IDEMPOTENCY_TTL_MS),
      },
    });
  }

  private findRecord(context: IdempotencyContext): Promise<IdempotencyRecord | null> {
    return this.prisma.idempotencyRecord.findUnique({
      where: { scope_idempotencyKey: { scope: context.scope, idempotencyKey: context.key } },
    });
  }

  private async complete(context: IdempotencyContext, result: OperationResult): Promise<void> {
    await this.prisma.idempotencyRecord.update({
      where: { scope_idempotencyKey: { scope: context.scope, idempotencyKey: context.key } },
      data: {
        status: IdempotencyStatus.COMPLETED,
        responseStatus: result.status,
        responseBody: toStoredBody(result.body),
      },
    });
  }

  private async release(context: IdempotencyContext): Promise<void> {
    await this.prisma.idempotencyRecord.deleteMany({
      where: {
        scope: context.scope,
        idempotencyKey: context.key,
        status: IdempotencyStatus.IN_PROGRESS,
      },
    });
  }
}
