import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InvoiceStatus as PrismaInvoiceStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';
import { InvoiceStatus } from '@easyfactura/shared-types';
import { CreatePaymentDto } from './dto/create-payment.dto';

const PAYABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(tenantId: string, invoiceId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.findPayableInvoice(tx, tenantId, invoiceId);

      const currentPaid = Number(invoice.amountPaid);
      const invoiceTotal = Number(invoice.total);
      const newAmount = dto.amount;

      if (currentPaid + newAmount > invoiceTotal) {
        const remaining = Math.round((invoiceTotal - currentPaid) * 100) / 100;
        throw new BadRequestException(
          `El importe supera el pendiente de cobro. Máximo: ${remaining} €`
        );
      }

      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount: newAmount,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod ?? null,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
        },
      });

      const updatedAmountPaid = Math.round((currentPaid + newAmount) * 100) / 100;
      const paymentStatus = this.resolvePaymentStatus(updatedAmountPaid, invoiceTotal);

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: updatedAmountPaid,
          paymentStatus,
          ...(paymentStatus === PrismaPaymentStatus.PAID
            ? { status: PrismaInvoiceStatus.PAID }
            : {}),
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });

      return { invoice: updatedInvoice, payment };
    });
  }

  async deletePayment(tenantId: string, invoiceId: string, paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId, invoiceId },
      });
      if (!payment) {
        throw new NotFoundException('Cobro no encontrado');
      }

      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: { id: true, amountPaid: true, total: true, status: true },
      });
      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      await tx.payment.delete({ where: { id: paymentId } });

      const updatedAmountPaid = Math.max(
        0,
        Math.round((Number(invoice.amountPaid) - Number(payment.amount)) * 100) / 100
      );
      const invoiceTotal = Number(invoice.total);
      const paymentStatus = this.resolvePaymentStatus(updatedAmountPaid, invoiceTotal);

      // If invoice was PAID and we're removing a payment, revert to CONFIRMED
      const shouldRevertStatus =
        invoice.status === PrismaInvoiceStatus.PAID && paymentStatus !== PrismaPaymentStatus.PAID;

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: updatedAmountPaid,
          paymentStatus,
          ...(shouldRevertStatus ? { status: PrismaInvoiceStatus.CONFIRMED } : {}),
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
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

  private resolvePaymentStatus(amountPaid: number, total: number): PrismaPaymentStatus {
    if (amountPaid <= 0) return PrismaPaymentStatus.UNPAID;
    if (amountPaid >= total) return PrismaPaymentStatus.PAID;
    return PrismaPaymentStatus.PARTIALLY_PAID;
  }
}
