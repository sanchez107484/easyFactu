import { BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import {
  assertPaymentAmountFits,
  resolvePaymentStatus,
} from '../src/modules/payments/payment-rules';
import { PaymentService } from '../src/modules/payments/payment.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('payment rules', () => {
  it.each([
    ['a positive payment within the amount due', 100, 30, 70],
    ['a refund within a credit note', -100, -20, -80],
  ])('accepts %s', (_label, total, paid, amount) => {
    expect(() => assertPaymentAmountFits(total, paid, amount)).not.toThrow();
  });

  it.each([
    ['zero on an invoice', 100, 0, 0, 'El importe debe ser mayor que 0'],
    [
      'a positive amount on a credit note',
      -100,
      0,
      10,
      'El importe del abono debe ser menor que 0',
    ],
    [
      'more than the amount due',
      100,
      30,
      70.01,
      'El importe supera el pendiente de cobro. Máximo: 70 €',
    ],
    [
      'more than the credit note',
      -100,
      -20,
      -80.01,
      'El importe supera el pendiente de abono. Máximo: 80 €',
    ],
  ])('rejects %s', (_label, total, paid, amount, message) => {
    expect(() => assertPaymentAmountFits(total, paid, amount)).toThrow(
      new BadRequestException(message)
    );
  });

  it.each([
    [0, 100, PaymentStatus.UNPAID],
    [40, 100, PaymentStatus.PARTIALLY_PAID],
    [100, 100, PaymentStatus.PAID],
    [0, -50, PaymentStatus.UNPAID],
    [-20, -50, PaymentStatus.PARTIALLY_PAID],
    [-50, -50, PaymentStatus.PAID],
  ])('amountPaid %d of total %d is %s', (amountPaid, total, status) => {
    expect(resolvePaymentStatus(amountPaid, total)).toBe(status);
  });
});

describe('PaymentService.deletePayment', () => {
  function setup(paymentMethod: string | null) {
    const tx = {
      payment: {
        findFirst: jest.fn(async () => ({ id: 'pay-1', amount: 20, paymentMethod })),
        delete: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(async () => ({
          id: 'inv-1',
          amountPaid: 20,
          total: 100,
          status: 'CONFIRMED',
        })),
        update: jest.fn(async () => ({ id: 'inv-1' })),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
    return { service: new PaymentService(prisma), tx };
  }

  it('refuses to delete one half of a compensation', async () => {
    const { service, tx } = setup('COMPENSATION');
    await expect(service.deletePayment('tenant-a', 'inv-1', 'pay-1')).rejects.toThrow(
      ConflictException
    );
    expect(tx.payment.delete).not.toHaveBeenCalled();
  });

  it('deletes any other payment and recalculates the balance', async () => {
    const { service, tx } = setup('CARD');
    await service.deletePayment('tenant-a', 'inv-1', 'pay-1');
    expect(tx.payment.delete).toHaveBeenCalledWith({ where: { id: 'pay-1' } });
    expect(tx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountPaid: 0, paymentStatus: PaymentStatus.UNPAID }),
      })
    );
  });
});
