import { Injectable } from '@nestjs/common';
import { InvoicePdfService } from '../../invoice-templates/pdf/invoice-pdf.service';
import { CreatePaymentDto } from '../../payments/dto/create-payment.dto';
import { PaymentService } from '../../payments/payment.service';
import { VerifactuCancellationService } from '../../verifactu/services/verifactu-cancellation.service';
import {
  IntegrationInvoiceResponse,
  IntegrationPaymentResponse,
} from '../dto/integration-responses.dto';
import { CancelInvoiceDto } from '../dto/invoice-records.dto';
import { RegisterPaymentDto } from '../dto/integration-payment.dto';
import { formatMoney } from '../utils/decimal';
import { IntegrationInvoicesService, todayInSpain } from './integration-invoices.service';

export interface RenderedPdf {
  buffer: Buffer;
  filename: string;
}

/** Actions on an invoice already issued through the API: PDF, payments and cancellation. */
@Injectable()
export class IntegrationInvoiceActionsService {
  constructor(
    private readonly invoices: IntegrationInvoicesService,
    private readonly payments: PaymentService,
    private readonly pdf: InvoicePdfService,
    private readonly cancellations: VerifactuCancellationService
  ) {}

  /** Cancellation record (RegistroAnulacion); the rules live in VerifactuCancellationService. */
  async cancel(
    tenantId: string,
    invoiceId: string,
    dto: CancelInvoiceDto
  ): Promise<IntegrationInvoiceResponse> {
    await this.invoices.assertIssuedInvoice(tenantId, invoiceId);
    await this.cancellations.cancelInvoice(tenantId, invoiceId, dto.reason.trim());
    return this.invoices.findOne(tenantId, invoiceId);
  }

  async renderPdf(tenantId: string, invoiceId: string): Promise<RenderedPdf> {
    await this.invoices.assertIssuedInvoice(tenantId, invoiceId);
    return this.pdf.generate(tenantId, invoiceId);
  }

  async registerPayment(
    tenantId: string,
    invoiceId: string,
    dto: RegisterPaymentDto
  ): Promise<IntegrationPaymentResponse> {
    await this.invoices.assertIssuedInvoice(tenantId, invoiceId);
    const { invoice, payment } = await this.payments.createPayment(
      tenantId,
      invoiceId,
      this.toCreatePaymentDto(dto)
    );
    const total = Number(invoice.total);
    const amountPaid = Number(invoice.amountPaid);
    return {
      id: payment.id,
      invoiceId,
      amount: formatMoney(payment.amount),
      paymentDate: payment.paymentDate.toISOString().slice(0, 10),
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      invoicePaymentStatus: invoice.paymentStatus,
      invoiceAmountPaid: formatMoney(amountPaid),
      invoiceAmountDue: formatMoney(Math.max(0, total - amountPaid)),
    };
  }

  private toCreatePaymentDto(dto: RegisterPaymentDto): CreatePaymentDto {
    const createDto = new CreatePaymentDto();
    createDto.amount = Number(dto.amount);
    createDto.paymentDate = dto.paymentDate ?? todayInSpain();
    createDto.paymentMethod = dto.paymentMethod;
    createDto.reference = dto.reference;
    return createDto;
  }
}
