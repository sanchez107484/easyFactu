import { Injectable, Logger } from '@nestjs/common';
import { RecurringInvoiceService } from './recurring-invoice.service';

const MAX_DETAIL_ENTRIES = 100;

/**
 * Processes all recurring invoices due for generation today.
 * Called by the trigger-scheduler endpoint (POST /recurring-invoices/trigger-scheduler).
 *
 * This service is intentionally separated from RecurringInvoiceService to keep
 * the scheduling logic isolated and testable.
 */
@Injectable()
export class RecurringInvoiceSchedulerService {
  private readonly logger = new Logger(RecurringInvoiceSchedulerService.name);

  constructor(private readonly recurringInvoiceService: RecurringInvoiceService) {}

  /**
   * Run the scheduler: find all due recurring invoices and generate one draft
   * invoice per each. Returns a summary of results.
   *
   * The `details` array is capped at MAX_DETAIL_ENTRIES (100) to prevent unbounded
   * response sizes when many invoices are processed. Full details are always logged.
   */
  async runScheduler(): Promise<{ processed: number; errors: number; details: string[] }> {
    this.logger.log('Starting recurring invoice scheduler run');

    const dueRecurrents = await this.recurringInvoiceService.findDueForGeneration();
    this.logger.log(`Found ${dueRecurrents.length} recurring invoices due for generation`);

    let processed = 0;
    let errors = 0;
    const details: string[] = [];

    for (const recurring of dueRecurrents) {
      try {
        await this.recurringInvoiceService.generateInvoiceFromTemplate(
          recurring.tenantId,
          recurring
        );
        await this.recurringInvoiceService.advanceAfterGeneration(recurring.id);

        processed++;
        const entry = `✓ [${recurring.id}] Factura generada para tenant ${recurring.tenantId}`;
        this.logger.log(entry);
        if (details.length < MAX_DETAIL_ENTRIES) {
          details.push(entry);
        }
      } catch (error) {
        errors++;
        const message = error instanceof Error ? error.message : String(error);
        const entry = `✗ [${recurring.id}] Error: ${message}`;
        this.logger.error(
          `Failed to generate invoice for recurring ${recurring.id}: ${message}`,
          error instanceof Error ? error.stack : undefined
        );
        if (details.length < MAX_DETAIL_ENTRIES) {
          details.push(entry);
        }
      }
    }

    this.logger.log(
      `Scheduler run complete: ${processed} processed, ${errors} errors`
    );

    return { processed, errors, details };
  }
}
