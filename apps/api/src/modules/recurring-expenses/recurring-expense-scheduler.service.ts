import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecurringExpensesService } from './recurring-expenses.service';

interface SchedulerMetrics {
  startedAt: Date;
  processedCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  tenantFailures: Map<string, number>;
}

interface SchedulerResult {
  success: boolean;
  metrics: {
    processedCount: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
    durationMs: number;
  };
  errors: Array<{ tenantId: string; recurringExpenseId: string; error: string }>;
}

@Injectable()
export class RecurringExpenseSchedulerService {
  private readonly logger = new Logger(RecurringExpenseSchedulerService.name);

  private static readonly MAX_EXPENSES_PER_RUN = 200;
  private static readonly MAX_CONSECUTIVE_FAILURES_PER_TENANT = 3;
  private static readonly CIRCUIT_BREAKER_THRESHOLD = 10;

  private circuitBroken = false;
  private circuitBrokenAt: Date | null = null;
  private failureCount = 0;

  constructor(
    private readonly recurringExpensesService: RecurringExpensesService,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<SchedulerResult> {
    const runId = this.generateRunId();
    const startedAt = new Date();
    const metrics: SchedulerMetrics = {
      startedAt,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      tenantFailures: new Map(),
    };
    const errors: SchedulerResult['errors'] = [];

    this.logger.log({
      message: 'Starting recurring expense generation',
      runId,
      timestamp: startedAt.toISOString(),
    });

    if (this.isCircuitBroken()) {
      this.logger.warn({
        message: 'Circuit breaker is open, skipping this run',
        runId,
        circuitBrokenAt: this.circuitBrokenAt?.toISOString(),
      });
      return {
        success: false,
        metrics: this.buildMetrics(metrics, startedAt),
        errors: [{ tenantId: 'SYSTEM', recurringExpenseId: 'CIRCUIT_BREAKER', error: 'Circuit breaker open' }],
      };
    }

    try {
      await this.processRecurringExpenses(runId, metrics, errors);
      this.failureCount = 0;
    } catch (error) {
      this.logger.error({
        message: 'Scheduler run failed with unhandled exception',
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const result = this.buildResult(runId, metrics, errors, startedAt);

    this.logSummary(runId, result);

    return result;
  }

  private async processRecurringExpenses(
    runId: string,
    metrics: SchedulerMetrics,
    errors: SchedulerResult['errors'],
  ): Promise<void> {
    while (metrics.processedCount < RecurringExpenseSchedulerService.MAX_EXPENSES_PER_RUN) {
      const dueRecurring = await this.recurringExpensesService.findDueRecurringExpensesAllTenants();

      if (dueRecurring.length === 0) break;

      this.logger.log({
        message: `Processing batch of ${dueRecurring.length} recurring expenses`,
        runId,
        batchNumber: Math.floor(metrics.processedCount / RecurringExpenseSchedulerService.MAX_EXPENSES_PER_RUN) + 1,
      });

      for (const recurring of dueRecurring) {
        if (metrics.processedCount >= RecurringExpenseSchedulerService.MAX_EXPENSES_PER_RUN) break;
        if (this.isCircuitBroken()) break;

        const tenantFailureCount = metrics.tenantFailures.get(recurring.tenantId) ?? 0;
        if (tenantFailureCount >= RecurringExpenseSchedulerService.MAX_CONSECUTIVE_FAILURES_PER_TENANT) {
          this.logger.warn({
            message: `Skipping tenant due to consecutive failures`,
            runId,
            tenantId: recurring.tenantId,
            failureCount: tenantFailureCount,
          });
          metrics.skippedCount++;
          continue;
        }

        const success = await this.processOneRecurringExpense(runId, recurring.tenantId, recurring.id, errors);

        if (success) {
          metrics.successCount++;
          metrics.tenantFailures.delete(recurring.tenantId);
        } else {
          metrics.failureCount++;
          const newCount = (metrics.tenantFailures.get(recurring.tenantId) ?? 0) + 1;
          metrics.tenantFailures.set(recurring.tenantId, newCount);

          if (metrics.failureCount >= RecurringExpenseSchedulerService.CIRCUIT_BREAKER_THRESHOLD) {
            this.circuitBroken = true;
            this.circuitBrokenAt = new Date();
            this.logger.error({
              message: 'Circuit breaker opened due to high failure rate',
              runId,
              failureCount: metrics.failureCount,
              circuitBrokenAt: this.circuitBrokenAt.toISOString(),
            });
          }
        }

        metrics.processedCount++;
      }
    }
  }

  private async processOneRecurringExpense(
    runId: string,
    tenantId: string,
    id: string,
    errors: SchedulerResult['errors'],
  ): Promise<boolean> {
    const itemStartTime = Date.now();

    try {
      const result = await this.recurringExpensesService.generate(tenantId, id);

      this.logger.log({
        message: 'Generated expenses from recurring',
        runId,
        tenantId,
        recurringExpenseId: id,
        generatedCount: result.generatedCount,
        durationMs: Date.now() - itemStartTime,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      errors.push({ tenantId, recurringExpenseId: id, error: errorMessage });

      this.logger.error({
        message: 'Failed to process recurring expense',
        runId,
        tenantId,
        recurringExpenseId: id,
        error: errorMessage,
        durationMs: Date.now() - itemStartTime,
      });

      return false;
    }
  }

  private isCircuitBroken(): boolean {
    if (!this.circuitBroken) return false;

    const cooldownMs = 5 * 60 * 1000;
    const cooldownExpired = this.circuitBrokenAt && Date.now() - this.circuitBrokenAt.getTime() > cooldownMs;

    if (cooldownExpired) {
      this.logger.log({
        message: 'Circuit breaker cooldown expired, resetting',
        circuitBrokenAt: this.circuitBrokenAt?.toISOString(),
      });
      this.circuitBroken = false;
      this.circuitBrokenAt = null;
      this.failureCount = 0;
      return false;
    }

    return true;
  }

  private buildResult(
    runId: string,
    metrics: SchedulerMetrics,
    errors: SchedulerResult['errors'],
    startedAt: Date,
  ): SchedulerResult {
    return {
      success: errors.length === 0 && !this.circuitBroken,
      metrics: {
        processedCount: metrics.processedCount,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        skippedCount: metrics.skippedCount,
        durationMs: Date.now() - startedAt.getTime(),
      },
      errors,
    };
  }

  private buildMetrics(metrics: SchedulerMetrics, startedAt: Date) {
    return {
      processedCount: metrics.processedCount,
      successCount: metrics.successCount,
      failureCount: metrics.failureCount,
      skippedCount: metrics.skippedCount,
      durationMs: Date.now() - startedAt.getTime(),
    };
  }

  private logSummary(runId: string, result: SchedulerResult): void {
    const logData = {
      message: 'Scheduler run completed',
      runId,
      success: result.success,
      metrics: result.metrics,
      errorCount: result.errors.length,
    };

    if (result.success) {
      this.logger.log(logData);
    } else {
      this.logger.warn(logData);
    }
  }

  private generateRunId(): string {
    return `re-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  getHealthStatus() {
    return {
      circuitBroken: this.circuitBroken,
      circuitBrokenAt: this.circuitBrokenAt?.toISOString() ?? null,
      consecutiveFailures: this.failureCount,
      isHealthy: !this.isCircuitBroken(),
    };
  }
}
