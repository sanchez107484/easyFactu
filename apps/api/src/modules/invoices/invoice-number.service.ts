import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SeriesType } from '@easyfactura/shared-types';

@Injectable()
export class InvoiceNumberService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds the default series for a tenant of the given type and current year.
   * Used when no seriesId is explicitly provided.
   */
  async findDefaultSeries(tenantId: string, seriesType: SeriesType = SeriesType.INVOICE) {
    const currentYear = new Date().getFullYear();

    const series = await this.prisma.invoiceSeries.findFirst({
      where: {
        tenantId,
        type: seriesType,
        isDefault: true,
        year: currentYear,
      },
    });

    if (!series) {
      throw new NotFoundException(
        `No se encontró una serie por defecto para el año ${currentYear}. ` +
          'Ve a Ajustes > Series de facturación para crear una.'
      );
    }

    return series;
  }

  /**
   * Generates the next invoice number for a series atomically.
   *
   * RULE: Must be called inside a Prisma transaction to ensure atomicity.
   * The UPDATE query on next_number is atomic at DB level (row lock).
   *
   * @returns The formatted invoice number (e.g. "F-2025-0001")
   */
  async generateNextNumber(
    tenantId: string,
    seriesId: string,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    // Atomically increment next_number and return new value
    // PostgreSQL UPDATE acquires a row lock, making this thread-safe
    const updated = await tx.invoiceSeries.update({
      where: {
        id: seriesId,
        tenantId, // Security: ensure series belongs to tenant
      },
      data: {
        nextNumber: { increment: 1 },
      },
      select: {
        nextNumber: true,
        prefix: true,
        digits: true,
        year: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('Serie de facturación no encontrada');
    }

    // nextNumber is already incremented, so the assigned number is nextNumber - 1
    const assignedNumber = updated.nextNumber - 1;

    return this.formatNumber(updated.prefix, updated.year, assignedNumber, updated.digits);
  }

  /**
   * Formats a number into the standard invoice number format.
   * The year is NOT added automatically — the prefix must include it if desired.
   * Example: prefix="F-2026-", number=1, digits=4 → "F-2026-0001"
   * Example: prefix="F-", number=1, digits=4 → "F-0001"
   */
  formatNumber(prefix: string, _year: number, number: number, digits: number): string {
    return `${prefix}${number.toString().padStart(digits, '0')}`;
  }

  /**
   * Finds or creates the QUOTE series for a tenant in the current year.
   * Auto-creates with prefix "PRE-" and 4 digits if it doesn't exist yet.
   * This avoids requiring the user to create a quote series before using quotes.
   */
  async findOrCreateQuoteSeries(tenantId: string, tx: Prisma.TransactionClient) {
    const currentYear = new Date().getFullYear();

    const existing = await tx.invoiceSeries.findFirst({
      where: { tenantId, type: SeriesType.QUOTE, year: currentYear },
    });

    if (existing) return existing;

    return tx.invoiceSeries.create({
      data: {
        tenantId,
        code: `PRE-${currentYear}`,
        name: `Presupuestos ${currentYear}`,
        type: SeriesType.QUOTE,
        prefix: 'PRE-',
        nextNumber: 1,
        digits: 4,
        year: currentYear,
        isDefault: true,
      },
    });
  }

  /**
   * Validates that a series belongs to a tenant and has not been used for the current year.
   * Used to validate the seriesId provided by the user.
   */
  async validateSeries(tenantId: string, seriesId: string) {
    const series = await this.prisma.invoiceSeries.findFirst({
      where: { id: seriesId, tenantId },
    });

    if (!series) {
      throw new NotFoundException('Serie de facturación no encontrada o no pertenece a tu cuenta');
    }

    const currentYear = new Date().getFullYear();
    if (series.year !== currentYear) {
      throw new BadRequestException(
        `La serie ${series.code} es del año ${series.year}. ` +
          `Para el año ${currentYear} debes usar o crear una serie de ese año.`
      );
    }

    return series;
  }
}
