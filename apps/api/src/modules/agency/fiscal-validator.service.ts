import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface FiscalAlert {
  type: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

// Limit for simplified invoices (facturas simplificadas) per AEAT regulation
const SIMPLIFIED_INVOICE_LIMIT = 400;

// NIF/CIF/NIE control letter algorithm
const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

@Injectable()
export class FiscalValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs a comprehensive set of fiscal validations for a client tenant.
   * Returns a list of alerts (errors/warnings/infos) the agency can review.
   */
  async validateClientFiscalHealth(
    agencyTenantId: string,
    clientTenantId: string
  ): Promise<FiscalAlert[]> {
    // Verify the agency-client relationship
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      select: { status: true },
    });

    if (!relation || relation.status !== 'ACTIVE') {
      return [];
    }

    const alerts: FiscalAlert[] = [];

    const [nifAlerts, duplicateAlerts, simplifiedAlerts, numberGapAlerts, verifactuAlerts] =
      await Promise.all([
        this.validateCustomerNifs(clientTenantId),
        this.detectDuplicateInvoices(clientTenantId),
        this.detectSimplifiedInvoiceLimitBreaches(clientTenantId),
        this.detectNumberingGaps(clientTenantId),
        this.detectPendingVerifactu(clientTenantId),
      ]);

    alerts.push(
      ...nifAlerts,
      ...duplicateAlerts,
      ...simplifiedAlerts,
      ...numberGapAlerts,
      ...verifactuAlerts
    );

    return alerts;
  }

  // ─── Validators ─────────────────────────────────────────────────────────────

  private async validateCustomerNifs(clientTenantId: string): Promise<FiscalAlert[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId: clientTenantId, isActive: true, nif: { not: '' } },
      select: { id: true, name: true, nif: true },
    });

    return customers
      .filter((c) => c.nif && !this.isValidNif(c.nif))
      .map((c) => ({
        type: 'error' as const,
        code: 'INVALID_NIF',
        title: `NIF inválido: ${c.name}`,
        description: `El NIF "${c.nif}" del cliente ${c.name} no supera la validación del dígito de control. Podría generar errores en VeriFactu.`,
      }));
  }

  private async detectDuplicateInvoices(clientTenantId: string): Promise<FiscalAlert[]> {
    const currentYear = new Date().getFullYear();

    // Find invoices with duplicate numbers in the same year (should be impossible with
    // our partial unique index, but defensively check for data anomalies)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: clientTenantId,
        status: { notIn: ['DRAFT'] },
        issueDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
        number: { not: null },
      },
      select: { id: true, number: true, issueDate: true },
      orderBy: { number: 'asc' },
    });

    const seen = new Map<string, string>(); // number → id
    const duplicates: FiscalAlert[] = [];

    for (const inv of invoices) {
      if (!inv.number) continue;

      if (seen.has(inv.number)) {
        duplicates.push({
          type: 'error',
          code: 'DUPLICATE_INVOICE_NUMBER',
          title: `Número de factura duplicado: ${inv.number}`,
          description: `Existen dos facturas con el número ${inv.number}. Esto es un error grave que debe corregirse antes de cualquier declaración fiscal.`,
          invoiceId: inv.id,
          invoiceNumber: inv.number,
        });
      } else {
        seen.set(inv.number, inv.id);
      }
    }

    return duplicates;
  }

  private async detectSimplifiedInvoiceLimitBreaches(
    clientTenantId: string
  ): Promise<FiscalAlert[]> {
    // A simplified invoice (factura simplificada) cannot exceed €400 total (AEAT Art. 4)
    // In our system, invoices without customer NIF are treated as simplified
    const oversizedSimplified = await this.prisma.invoice.findMany({
      where: {
        tenantId: clientTenantId,
        status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
        total: { gt: SIMPLIFIED_INVOICE_LIMIT },
        customer: {
          nif: '',
        },
      },
      select: { id: true, number: true, total: true },
      take: 10, // Cap results to avoid flooding
    });

    return oversizedSimplified.map((inv) => ({
      type: 'warning' as const,
      code: 'SIMPLIFIED_INVOICE_OVER_LIMIT',
      title: `Factura simplificada supera el límite: ${inv.number}`,
      description: `La factura ${inv.number} (${Number(inv.total).toFixed(2)} €) supera el límite de ${SIMPLIFIED_INVOICE_LIMIT} € para facturas simplificadas. Debería emitirse como factura completa con datos del cliente.`,
      invoiceId: inv.id,
      invoiceNumber: inv.number ?? undefined,
    }));
  }

  private async detectNumberingGaps(clientTenantId: string): Promise<FiscalAlert[]> {
    const currentYear = new Date().getFullYear();

    const confirmedInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: clientTenantId,
        status: { notIn: ['DRAFT', 'PROFORMA', 'QUOTE'] },
        issueDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
        number: { not: null },
        isRectificative: false,
      },
      select: { id: true, number: true },
      orderBy: { number: 'asc' },
    });

    const gaps = this.findNumberingGaps(confirmedInvoices.map((i) => i.number as string));

    return gaps.map(({ from, to }) => ({
      type: 'warning' as const,
      code: 'INVOICE_NUMBER_GAP',
      title: `Hueco en la numeración de facturas`,
      description: `Falta${from === to ? ` la factura ${from}` : `n las facturas ${from} a ${to}`} en la secuencia. Los huecos en la numeración pueden generar requerimientos de la AEAT.`,
    }));
  }

  private async detectPendingVerifactu(clientTenantId: string): Promise<FiscalAlert[]> {
    const pendingCount = await this.prisma.invoice.count({
      where: {
        tenantId: clientTenantId,
        status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
        verifactuStatus: { in: ['PENDING', 'ERROR', 'REJECTED'] },
      },
    });

    if (pendingCount === 0) return [];

    return [
      {
        type: pendingCount > 5 ? ('error' as const) : ('warning' as const),
        code: 'VERIFACTU_PENDING',
        title: `${pendingCount} factura${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} de VeriFactu`,
        description: `Hay ${pendingCount} factura${pendingCount > 1 ? 's' : ''} confirmada${pendingCount > 1 ? 's' : ''} que no ${pendingCount > 1 ? 'han sido enviadas' : 'ha sido enviada'} correctamente a la AEAT. Revisa el estado en el panel VeriFactu.`,
      },
    ];
  }

  // ─── NIF/CIF/NIE algorithm ──────────────────────────────────────────────────

  isValidNif(nif: string): boolean {
    const normalized = nif
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, '');

    if (!normalized || normalized.length < 8 || normalized.length > 9) return false;

    // CIF (companies): starts with letter A-H, J, N, P, Q, R, S, U, V, W
    if (/^[ABCDEFGHJNPQRSUVW]/i.test(normalized)) {
      return this.validateCif(normalized);
    }

    // NIE (foreign nationals): starts with X, Y, Z
    if (/^[XYZ]/i.test(normalized)) {
      return this.validateNie(normalized);
    }

    // NIF (individuals): 8 digits + control letter
    if (/^\d{8}[A-Z]$/i.test(normalized)) {
      return this.validateNifIndividual(normalized);
    }

    return false;
  }

  private validateNifIndividual(nif: string): boolean {
    const num = parseInt(nif.substring(0, 8), 10);
    const letter = nif.charAt(8).toUpperCase();
    return NIF_LETTERS[num % 23] === letter;
  }

  private validateNie(nie: string): boolean {
    // Replace leading letter: X→0, Y→1, Z→2
    const replacements: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const normalized = replacements[nie.charAt(0)] + nie.substring(1);
    return this.validateNifIndividual(normalized);
  }

  private validateCif(cif: string): boolean {
    if (cif.length !== 9) return false;

    const letters = cif.charAt(0).toUpperCase();
    const digits = cif.substring(1, 8);
    const control = cif.charAt(8).toUpperCase();

    if (!/^\d{7}$/.test(digits)) return false;

    let oddSum = 0;
    let evenSum = 0;

    for (let i = 0; i < 7; i++) {
      const digit = parseInt(digits[i]!, 10);
      if (i % 2 === 0) {
        // Odd positions (1-indexed): multiply by 2
        const doubled = digit * 2;
        oddSum += doubled >= 10 ? doubled - 9 : doubled;
      } else {
        evenSum += digit;
      }
    }

    const total = oddSum + evenSum;
    const checkDigit = (10 - (total % 10)) % 10;

    // Organizations P, Q, R, S, W, N must use a letter as control
    const mustUseLetter = /^[PQRSNW]$/.test(letters);
    // Organizations A, B, E, H must use a digit as control
    const mustUseDigit = /^[ABEH]$/.test(letters);

    if (mustUseLetter) {
      return control === CIF_CONTROL_LETTERS[checkDigit];
    }

    if (mustUseDigit) {
      return control === String(checkDigit);
    }

    // Others can use either
    return control === String(checkDigit) || control === CIF_CONTROL_LETTERS[checkDigit];
  }

  // ─── Numbering gap detector ─────────────────────────────────────────────────

  private findNumberingGaps(numbers: string[]): Array<{ from: string; to: string }> {
    if (numbers.length < 2) return [];

    // Group by series prefix (e.g., 'F2026-' or 'FAC-')
    const byPrefix = new Map<string, number[]>();

    for (const num of numbers) {
      const match = /^(.*?)(\d+)$/.exec(num);
      if (!match) continue;

      const prefix = match[1] ?? '';
      const seq = parseInt(match[2]!, 10);

      if (!byPrefix.has(prefix)) {
        byPrefix.set(prefix, []);
      }
      byPrefix.get(prefix)!.push(seq);
    }

    const gaps: Array<{ from: string; to: string }> = [];

    for (const [prefix, seqs] of byPrefix.entries()) {
      const sorted = [...seqs].sort((a, b) => a - b);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]!;
        const next = sorted[i + 1]!;

        if (next - current > 1) {
          const padLength = String(current).length;
          gaps.push({
            from: `${prefix}${String(current + 1).padStart(padLength, '0')}`,
            to:
              next - current === 2
                ? `${prefix}${String(next - 1).padStart(padLength, '0')}`
                : `${prefix}${String(next - 1).padStart(padLength, '0')}`,
          });
        }
      }
    }

    return gaps;
  }
}
