import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InvoiceStatus as PrismaInvoiceStatus,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';
import { InvoiceStatus } from '@easyfactura/shared-types';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { assertPaymentAmountFits, resolvePaymentStatus, roundMoney } from './payment-rules';

const PAYABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

const INVOICE_WITH_PAYMENTS = {
  lines: { orderBy: { sortOrder: 'asc' } },
  customer: true,
  series: true,
  payments: { orderBy: { paymentDate: 'desc' } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(tenantId: string, invoiceId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction((tx) => this.applyPayment(tx, tenantId, invoiceId, dto));
  }

  /**
   * Records a payment (or a refund on a credit note) inside a transaction the caller owns,
   * so it commits or rolls back together with the caller's other writes.
   */
  async applyPayment(
    tx: Prisma.TransactionClient,
    tenantId: string,
    invoiceId: string,
    dto: CreatePaymentDto
  ) {
    const invoice = await this.findPayableInvoice(tx, tenantId, invoiceId);
    const invoiceTotal = Number(invoice.total);
    const currentPaid = Number(invoice.amountPaid);
    assertPaymentAmountFits(invoiceTotal, currentPaid, dto.amount);

    const payment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod ?? null,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      },
    });

    const amountPaid = roundMoney(currentPaid + dto.amount);
    const paymentStatus = resolvePaymentStatus(amountPaid, invoiceTotal);
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid,
        paymentStatus,
        ...(paymentStatus === PrismaPaymentStatus.PAID ? { status: PrismaInvoiceStatus.PAID } : {}),
      },
      include: INVOICE_WITH_PAYMENTS,
    });
    return { invoice: updatedInvoice, payment };
  }

  async deletePayment(tenantId: string, invoiceId: string, paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await this.findDeletablePayment(tx, tenantId, invoiceId, paymentId);
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: { id: true, amountPaid: true, total: true, status: true },
      });
      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      await tx.payment.delete({ where: { id: paymentId } });

      const amountPaid = roundMoney(Number(invoice.amountPaid) - Number(payment.amount));
      const paymentStatus = resolvePaymentStatus(amountPaid, Number(invoice.total));
      // A PAID invoice that loses a payment goes back to CONFIRMED.
      const shouldRevertStatus =
        invoice.status === PrismaInvoiceStatus.PAID && paymentStatus !== PrismaPaymentStatus.PAID;

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid,
          paymentStatus,
          ...(shouldRevertStatus ? { status: PrismaInvoiceStatus.CONFIRMED } : {}),
        },
        include: INVOICE_WITH_PAYMENTS,
      });
    });
  }

  async getPayments(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    return this.prisma.payment.findMany({
      where: { tenantId, invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * A compensation is one half of a pair (original invoice and rectificative) recorded with the
   * return; deleting one half would leave the two invoices out of balance.
   */
  private async findDeletablePayment(
    tx: Prisma.TransactionClient,
    tenantId: string,
    invoiceId: string,
    paymentId: string
  ) {
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, tenantId, invoiceId },
    });
    if (!payment) {
      throw new NotFoundException('Cobro no encontrado');
    }
    if (payment.paymentMethod === PrismaPaymentMethod.COMPENSATION) {
      throw new ConflictException(
        'Las compensaciones se registran con la devolución y no se pueden eliminar'
      );
    }
    return payment;
  }

  private async findPayableInvoice(
    tx: Prisma.TransactionClient,
    tenantId: string,
    invoiceId: string
  ) {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: {
        id: true,
        status: true,
        total: true,
        amountPaid: true,
        paymentStatus: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (!PAYABLE_STATUSES.includes(invoice.status as InvoiceStatus)) {
      throw new ConflictException(
        'Solo se pueden registrar cobros en facturas confirmadas, enviadas o pagadas'
      );
    }

    return invoice;
  }
}
