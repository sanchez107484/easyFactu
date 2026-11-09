import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

const CANCELLATION_MARKER = 'ANULACION';

interface InvoiceHashData {
  /**
   * NIF of the invoice issuer (tenant). Must be taken from `issuerSnapshotNif`
   * for confirmed invoices so the hash is always computed with the NIF that was
   * current at confirmation time — not the potentially-updated live tenant data.
   */
  issuerNif: string;
  number: string;
  issueDate: Date;
  total: number;
}

@Injectable()
export class VerifactuHashService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate SHA-256 hash for an invoice according to VeriFactu spec
   * Hash format: SHA256(NIF + Número + Fecha + Importe + HashAnterior)
   */
  async generateHash(
    tenantId: string,
    invoiceData: InvoiceHashData
  ): Promise<{ hash: string; prevHash: string | null }> {
    this.assertIssuerNif(invoiceData.issuerNif);
    const prevHash = await this.findPreviousHash(tenantId);

    const hashString = this.buildHashString(
      invoiceData.issuerNif,
      invoiceData.number,
      invoiceData.issueDate,
      invoiceData.total,
      prevHash ?? ''
    );

    return { hash: this.sha256(hashString), prevHash };
  }

  /**
   * Hash of a cancellation record (RegistroAnulacion). It identifies the annulled invoice
   * and is chained after the latest record of the tenant, like an invoice.
   * Format: SHA256(NIF + Número + Fecha + "ANULACION" + HashAnterior)
   */
  async generateCancellationHash(
    tenantId: string,
    annulled: Omit<InvoiceHashData, 'total'>
  ): Promise<{ hash: string; prevHash: string | null }> {
    this.assertIssuerNif(annulled.issuerNif);
    const prevHash = await this.findPreviousHash(tenantId);
    const hashString = `${annulled.issuerNif}${annulled.number}${this.formatHashDate(annulled.issueDate)}${CANCELLATION_MARKER}${prevHash ?? ''}`;
    return { hash: this.sha256(hashString), prevHash };
  }

  /**
   * Hash of the latest record of the tenant chain: invoices (any status once hashed) and
   * cancellation records, ordered by generation time (chainedAt). Records hashed before
   * chainedAt existed fall back to the issue date.
   */
  async findPreviousHash(tenantId: string): Promise<string | null> {
    const [lastInvoice, lastCancellation] = await Promise.all([
      this.prisma.invoice.findFirst({
        where: { tenantId, hash: { not: null } },
        orderBy: [{ chainedAt: { sort: 'desc', nulls: 'last' } }, { issueDate: 'desc' }],
        select: { hash: true, chainedAt: true },
      }),
      this.prisma.invoiceCancellation.findFirst({
        where: { tenantId, hash: { not: null } },
        orderBy: { chainedAt: { sort: 'desc', nulls: 'last' } },
        select: { hash: true, chainedAt: true },
      }),
    ]);
    if (!lastCancellation) return lastInvoice?.hash ?? null;
    if (!lastInvoice) return lastCancellation.hash;
    const invoiceTime = lastInvoice.chainedAt?.getTime() ?? 0;
    const cancellationTime = lastCancellation.chainedAt?.getTime() ?? 0;
    return invoiceTime > cancellationTime ? lastInvoice.hash : lastCancellation.hash;
  }

  private assertIssuerNif(issuerNif: string): void {
    if (!issuerNif) {
      throw new Error(
        'No se puede generar el hash: el NIF del emisor está vacío. ' +
          'Comprueba que el snapshot del emisor se generó correctamente al confirmar la factura.'
      );
    }
  }

  /**
   * Build the hash string according to VeriFactu specification
   * Format: NIF + Number + DDMMYYYY + Total (2 decimals) + PrevHash
   */
  private buildHashString(
    nif: string,
    number: string,
    issueDate: Date,
    total: number,
    prevHash: string
  ): string {
    const formattedDate = this.formatHashDate(issueDate);

    // Format total with 2 decimals
    const formattedTotal = total.toFixed(2);

    return `${nif}${number}${formattedDate}${formattedTotal}${prevHash}`;
  }

  /** DDMMYYYY (server local date, as invoices have always been hashed). */
  private formatHashDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}${month}${date.getFullYear()}`;
  }

  /**
   * Generate SHA-256 hash
   */
  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * Verify hash chain integrity
   * Checks that the invoice hash is correct and matches the stored prevHash
   */
  async verifyHashChain(tenantId: string, invoiceId: string): Promise<boolean> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: {
        hash: true,
        prevHash: true,
        number: true,
        issueDate: true,
        total: true,
        issuerSnapshotNif: true,
      },
    });

    if (!invoice || !invoice.hash) {
      return false;
    }

    if (!invoice.number) {
      return false; // Cannot verify hash for an invoice without a number
    }

    const issuerNif = invoice.issuerSnapshotNif ?? '';
    if (!issuerNif) {
      return false; // Cannot verify hash without the issuer NIF snapshot
    }

    // Regenerate hash using the immutable snapshot NIF and compare
    const { hash, prevHash } = await this.generateHash(tenantId, {
      issuerNif,
      number: invoice.number,
      issueDate: invoice.issueDate,
      total: Number(invoice.total),
    });

    // Verify hash matches
    if (hash !== invoice.hash) {
      return false;
    }

    // Verify prevHash matches (if it exists)
    if (invoice.prevHash !== prevHash) {
      return false;
    }

    return true;
  }
}
