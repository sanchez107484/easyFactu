import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../prisma/prisma.service';
import { Public } from '../../../common/decorators/public.decorator';
import { InvoiceStatus } from '@easyfactura/shared-types';

/** Shape of the public verification response. Only non-sensitive data. */
interface PublicInvoiceVerification {
  issuer: {
    tradeName: string;
    /** NIF partially masked: B****5678 */
    nifMasked: string;
  };
  invoice: {
    number: string;
    series: string | null;
    issueDate: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    currency: string;
    status: InvoiceStatus;
  };
  /** First 12 chars of the SHA-256 hash chain — enough for visual confirmation */
  hashFragment: string;
  /** Full SHA-256 hash — for manual verification by technical users */
  hashFull: string;
  /** ISO timestamp of when the invoice was confirmed */
  confirmedAt: string;
  /** Verification mode used to generate the QR */
  mode: string;
}

@ApiTags('public')
@Controller('public/verify')
export class PublicVerifyController {
  constructor(private prisma: PrismaService) {}

  /**
   * Public endpoint — no JWT required.
   * Returns non-sensitive data for a confirmed invoice identified by its SHA-256 hash.
   * Rate-limited to 20 requests per minute per IP to prevent hash enumeration.
   */
  @Get(':hash')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verificar factura por hash (endpoint público)',
    description:
      'Devuelve los datos básicos de una factura confirmada para verificar su autenticidad. No requiere autenticación.',
  })
  @ApiOkResponse({ description: 'Factura verificada correctamente' })
  @ApiNotFoundResponse({ description: 'Factura no encontrada o no verificable' })
  async verifyByHash(@Param('hash') hash: string): Promise<PublicInvoiceVerification> {
    // Normalise to lowercase so QR codes that encode uppercase hex still work
    const normalizedHash = hash.toLowerCase();

    // Validate hash format: must be a 64-char hex string (SHA-256)
    if (!/^[0-9a-f]{64}$/.test(normalizedHash)) {
      throw new NotFoundException('Factura no encontrada');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        hash: { equals: normalizedHash, mode: 'insensitive' },
        // Solo verificamos facturas activas. Excluimos:
        // - DRAFT/PROFORMA/QUOTE: aún no están confirmadas
        // - RECTIFIED: la factura original fue rectificada y ya no es válida
        // Las facturas rectificativas (isRectificative=true) sí son verificables
        // cuando están en estado CONFIRMED/SENT/PAID.
        status: {
          in: [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID],
        },
      },
      select: {
        number: true,
        series: { select: { code: true } },
        issueDate: true,
        subtotal: true,
        taxTotal: true,
        total: true,
        status: true,
        hash: true,
        updatedAt: true,
        issuerSnapshotNif: true,
        issuerSnapshotName: true,
        issuerSnapshotLegalName: true,
        tenantId: true,
      },
    });

    if (!invoice || !invoice.number || !invoice.hash) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Determine display name from immutable snapshot
    const tradeName =
      invoice.issuerSnapshotName ?? invoice.issuerSnapshotLegalName ?? 'Emisor desconocido';

    return {
      issuer: {
        tradeName,
        nifMasked: this.maskNif(invoice.issuerSnapshotNif),
      },
      invoice: {
        number: invoice.number,
        series: invoice.series?.code ?? null,
        issueDate: invoice.issueDate.toISOString().slice(0, 10),
        subtotal: Number(invoice.subtotal),
        taxTotal: Number(invoice.taxTotal),
        total: Number(invoice.total),
        currency: 'EUR',
        status: invoice.status as InvoiceStatus,
      },
      hashFragment: invoice.hash.slice(0, 12),
      hashFull: invoice.hash,
      confirmedAt: invoice.updatedAt.toISOString(),
      mode: 'internal',
    };
  }

  /** Masks a NIF/CIF leaving only the first letter and last 4 chars visible: B****5678 */
  private maskNif(nif: string | null): string {
    if (!nif || nif.length < 2) return '****';
    const first = nif[0];
    const last = nif.slice(-4);
    const stars = '*'.repeat(Math.max(0, nif.length - 5));
    return `${first}${stars}${last}`;
  }
}
