import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VerifactuQrService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate VeriFactu QR code URL according to AEAT specification
   * Format: https://prewww1.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=X&numserie=Y&fecha=DDMMYYYY&importe=Z
   */
  async generateQrUrl(tenantId: string, invoiceId: string): Promise<string> {
    // Get invoice data
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    // Get tenant NIF
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nif: true },
    });

    if (!tenant?.nif) {
      throw new Error('El tenant no tiene NIF configurado');
    }

    // Build QR URL parameters
    const params = new URLSearchParams({
      nif: tenant.nif,
      numserie: invoice.number,
      fecha: this.formatDateForQr(invoice.issueDate),
      importe: invoice.total.toFixed(2),
    });

    // AEAT QR validation endpoint (sandbox for development)
    const baseUrl =
      process.env.NODE_ENV === 'production'
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
