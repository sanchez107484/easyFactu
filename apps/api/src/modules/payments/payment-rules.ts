import { BadRequestException } from '@nestjs/common';
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client';

export function roundMoney(euros: number): number {
  return Math.round(euros * 100) / 100;
}

/**
 * The amount must go in the invoice's direction and fit in what is left:
 * a normal invoice (total > 0) takes positive payments up to the amount due; a credit note
 * (total < 0) takes negative refunds down to its total (remaining -100 accepts -50, not -150).
 */
export function assertPaymentAmountFits(
  invoiceTotal: number,
  currentPaid: number,
  amount: number
): void {
  if (invoiceTotal > 0 && amount <= 0) {
    throw new BadRequestException('El importe debe ser mayor que 0');
  }
  if (invoiceTotal < 0 && amount >= 0) {
    throw new BadRequestException('El importe del abono debe ser menor que 0');
  }
  if (amount === 0) {
    throw new BadRequestException('El importe no puede ser 0');
  }
  const remaining = roundMoney(invoiceTotal - currentPaid);
  if (invoiceTotal < 0 && amount < remaining) {
    throw new BadRequestException(
      `El importe supera el pendiente de abono. Máximo: ${Math.abs(remaining)} €`
    );
  }
  if (invoiceTotal >= 0 && amount > remaining) {
    throw new BadRequestException(
      `El importe supera el pendiente de cobro. Máximo: ${remaining} €`
    );
  }
}

/** For a credit note amountPaid is negative (refunds) or 0. */
export function resolvePaymentStatus(amountPaid: number, total: number): PrismaPaymentStatus {
  if (total < 0) {
    if (amountPaid === 0) return PrismaPaymentStatus.UNPAID;
    if (amountPaid <= total) return PrismaPaymentStatus.PAID;
    return PrismaPaymentStatus.PARTIALLY_PAID;
  }
  if (amountPaid <= 0) return PrismaPaymentStatus.UNPAID;
  if (amountPaid >= total) return PrismaPaymentStatus.PAID;
  return PrismaPaymentStatus.PARTIALLY_PAID;
}
