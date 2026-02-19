import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

interface InvoiceHashData {
  nif: string;
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
    // Get tenant NIF
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nif: true },
    });

    if (!tenant?.nif) {
      throw new Error('El tenant no tiene NIF configurado');
    }

    // Get previous invoice hash from the same tenant
    const previousInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        status: 'CONFIRMED',
        hash: { not: null },
      },
      orderBy: { issueDate: 'desc' },
      select: { hash: true },
    });

    const prevHash = previousInvoice?.hash || '';

    // Build hash string according to VeriFactu specification
    const hashString = this.buildHashString(
      tenant.nif,
      invoiceData.number,
      invoiceData.issueDate,
      invoiceData.total,
      prevHash
    );

    // Generate SHA-256 hash
    const hash = this.sha256(hashString);

    return { hash, prevHash: prevHash || null };
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
    // Format date as DDMMYYYY
    const day = issueDate.getDate().toString().padStart(2, '0');
    const month = (issueDate.getMonth() + 1).toString().padStart(2, '0');
    const year = issueDate.getFullYear().toString();
    const formattedDate = `${day}${month}${year}`;

    // Format total with 2 decimals
    const formattedTotal = total.toFixed(2);

    return `${nif}${number}${formattedDate}${formattedTotal}${prevHash}`;
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
      include: { customer: true },
    });

    if (!invoice || !invoice.hash) {
      return false;
    }

    // Regenerate hash and compare
    const { hash, prevHash } = await this.generateHash(tenantId, {
      nif: invoice.customer.nif,
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
