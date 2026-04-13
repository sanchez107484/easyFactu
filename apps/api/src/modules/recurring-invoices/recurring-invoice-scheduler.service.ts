import { Injectable, Logger } from '@nestjs/common';
import { RecurringInvoiceService } from './recurring-invoice.service';

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
        details.push(`✓ [${recurring.id}] Factura generada para tenant ${recurring.tenantId}`);
        this.logger.log(
          `Generated invoice for recurring ${recurring.id} (tenant: ${recurring.tenantId})`
        );
      } catch (error) {
        errors++;
        const message = error instanceof Error ? error.message : String(error);
        details.push(`✗ [${recurring.id}] Error: ${message}`);
        this.logger.error(
          `Failed to generate invoice for recurring ${recurring.id}: ${message}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    this.logger.log(
      `Scheduler run complete: ${processed} processed, ${errors} errors`
    );

    return { processed, errors, details };
  }
}
