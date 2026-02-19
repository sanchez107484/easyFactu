import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { VerifactuStatus } from '@easyfactura/shared-types';

@Injectable()
export class VerifactuSenderService {
  private readonly logger = new Logger(VerifactuSenderService.name);
  private readonly AEAT_SANDBOX_URL = 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ValidarQR';
  private readonly AEAT_PRODUCTION_URL =
    'https://www.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private http: HttpService
  ) {}

  /**
   * Send signed XML to AEAT VeriFactu endpoint
   */
  async sendToAeat(tenantId: string, invoiceId: string, signedXml: string): Promise<void> {
    const isProduction = this.config.get('NODE_ENV') === 'production';
    const endpoint = isProduction ? this.AEAT_PRODUCTION_URL : this.AEAT_SANDBOX_URL;

    try {
      // Send to AEAT
      const response = await firstValueFrom(
        this.http.post(endpoint, signedXml, {
          headers: {
            'Content-Type': 'application/xml',
            Accept: 'application/xml',
          },
        })
      );

      // Log success
      await this.logVerifactuSubmission(tenantId, invoiceId, {
        action: 'SENT',
        requestXml: signedXml,
        responseXml: JSON.stringify(response.data),
        statusCode: response.status,
      });

      // Update invoice
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          verifactuStatus: VerifactuStatus.ACCEPTED,
          verifactuSentAt: new Date(),
        },
      });

      this.logger.log(`Invoice ${invoiceId} sent to AEAT successfully`);
    } catch (error: any) {
      // Log error
      await this.logVerifactuSubmission(tenantId, invoiceId, {
        action: 'ERROR',
        requestXml: signedXml,
        responseXml: error.response?.data ? JSON.stringify(error.response.data) : undefined,
        statusCode: error.response?.status,
        errorMessage: error.message,
      });

      // Update invoice
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          verifactuStatus: VerifactuStatus.ERROR,
        },
      });

      this.logger.error(`Error sending invoice ${invoiceId} to AEAT:`, error.message);
      throw error;
    }
  }

  /**
   * Log VeriFactu submission attempt
   */
  private async logVerifactuSubmission(
    tenantId: string,
    invoiceId: string,
    data: {
      action: string;
      requestXml?: string;
      responseXml?: string;
      statusCode?: number;
      errorMessage?: string;
      attempt?: number;
    }
  ): Promise<void> {
    await this.prisma.verifactuLog.create({
      data: {
        tenantId,
        invoiceId,
        action: data.action,
        requestXml: data.requestXml,
        responseXml: data.responseXml,
        statusCode: data.statusCode,
        errorMessage: data.errorMessage,
        attempt: data.attempt || 1,
      },
    });
  }

  /**
   * Retry failed submissions
   */
  async retryFailedSubmission(
    tenantId: string,
    invoiceId: string,
    signedXml: string
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (invoice.verifactuStatus !== VerifactuStatus.ERROR) {
      throw new Error('Solo se pueden reintentar facturas con error');
    }

    return this.sendToAeat(tenantId, invoiceId, signedXml);
  }
}
