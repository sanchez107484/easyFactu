import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VerifactuQrService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  /**
   * Generate internal verification URL using the invoice hash.
   * Used when QR_MODE=internal (default — before VeriFactu/Naticket is operational).
   * Format: {PUBLIC_VERIFY_URL}/{hash}
   */
  generateInternalQrUrl(hash: string): string {
    const baseUrl = this.config.get<string>('PUBLIC_VERIFY_URL', 'http://localhost:3000/verify');
    // Always use lowercase hash in URLs for consistent routing
    return `${baseUrl}/${hash.toLowerCase()}`;
  }

  /**
   * Generate VeriFactu QR code URL according to AEAT specification.
   * Used when QR_MODE=verifactu.
   * Format: https://prewww1.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=X&numserie=Y&fecha=DDMMYYYY&importe=Z
   */
  async generateQrUrl(tenantId: string, invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (!invoice.number) {
      throw new Error('Solo se puede generar QR para facturas con número asignado (confirmadas)');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nif: true },
    });

    if (!tenant?.nif) {
      throw new Error('El tenant no tiene NIF configurado');
    }

    const params = new URLSearchParams({
      nif: tenant.nif,
      numserie: invoice.number,
      fecha: this.formatDateForQr(invoice.issueDate),
      importe: invoice.total.toFixed(2),
    });

    const environment = this.config.get<string>('VERIFACTU_ENVIRONMENT', 'sandbox');
    const baseUrl =
      environment === 'production'
        ? 'https://www.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
        : 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ValidarQR';

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate QR code image as Base64
   */
  async generateQrImage(tenantId: string, invoiceId: string): Promise<string> {
    const url = await this.generateQrUrl(tenantId, invoiceId);

    // Generate QR code as data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
    });

    return qrDataUrl;
  }

  /**
   * Generate QR code as Buffer (for embedding in PDFs)
   */
  async generateQrBuffer(tenantId: string, invoiceId: string): Promise<Buffer> {
    const url = await this.generateQrUrl(tenantId, invoiceId);

    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
    });

    return buffer;
  }

  /**
   * Format date for QR code (DDMMYYYY)
   */
  private formatDateForQr(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}${month}${year}`;
  }
}
