import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentMethod } from '@easyfactura/shared-types';
import { ConfirmedInvoiceSummary } from '../../invoices/invoice.service';
import { CreatePaymentDto } from '../../payments/dto/create-payment.dto';
import { PaymentService } from '../../payments/payment.service';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import {
  RectificationSettlementDto,
  SettlementRefundDto,
} from '../dto/rectification-settlement.dto';
import { parseScaled, toCents } from '../utils/decimal';
import {
  fiscalRule,
  isCalendarDate,
  todayInSpain,
  validationError,
} from './integration-invoice-rules';

const MONEY_SCALE = 2;

/** A settlement already checked against the rectificative and the original invoice. */
export interface SettlementPlan {
  refund?: {
    cents: bigint;
    paymentMethod: SettlementRefundDto['paymentMethod'];
    paymentDate: string;
    reference?: string;
  };
  compensationCents: bigint;
  original: { id: string; number: string };
}

/**
 * Settlement of a return (HU-21F): the refund becomes a negative payment of the rectificative;
 * the compensation settles the rectificative and reduces what the original invoice still owes.
 * It is validated before anything is issued and applied inside the confirmation transaction.
 */
@Injectable()
export class IntegrationSettlementService {
  constructor(private readonly payments: PaymentService) {}

  /** @param returnCents total of the rectificative in positive cents */
  plan(
    settlement: RectificationSettlementDto,
    returnCents: bigint,
    original: IntegrationInvoiceResponse
  ): SettlementPlan {
    if (!settlement.refund && !settlement.compensation) {
      throw validationError(
        'settlement vacío',
        'settlement',
        'Indica refund, compensation o ambos'
      );
    }
    const refund = settlement.refund ? planRefund(settlement.refund) : undefined;
    const compensationCents = settlement.compensation
      ? parseScaled(settlement.compensation.amount, MONEY_SCALE)
      : 0n;
    assertSettlesTheReturn((refund?.cents ?? 0n) + compensationCents, returnCents);
    assertWithinOriginalDue(compensationCents, original);
    return { refund, compensationCents, original: { id: original.id, number: original.number } };
  }

  /** Runs inside the confirmation transaction of the rectificative. */
  async apply(
    tx: Prisma.TransactionClient,
    tenantId: string,
    plan: SettlementPlan,
    rectificative: ConfirmedInvoiceSummary
  ): Promise<void> {
    if (plan.refund) {
      await this.payments.applyPayment(
        tx,
        tenantId,
        rectificative.id,
        toRefundPayment(plan.refund)
      );
    }
    if (plan.compensationCents > 0n) {
      await this.applyCompensation(tx, tenantId, plan, rectificative);
    }
  }

  /** Same amount on both sides: paid on the original, settled on the rectificative. */
  private async applyCompensation(
    tx: Prisma.TransactionClient,
    tenantId: string,
    plan: SettlementPlan,
    rectificative: ConfirmedInvoiceSummary
  ): Promise<void> {
    const amount = Number(plan.compensationCents) / 100;
    const rectificativeNumber = rectificative.number ?? rectificative.id;
    await this.payments.applyPayment(
      tx,
      tenantId,
      plan.original.id,
      compensationPayment(amount, `Compensación con la rectificativa ${rectificativeNumber}`)
    );
    await this.payments.applyPayment(
      tx,
      tenantId,
      rectificative.id,
      compensationPayment(-amount, `Compensada con la factura ${plan.original.number}`)
    );
  }
}

function planRefund(refund: SettlementRefundDto): NonNullable<SettlementPlan['refund']> {
  const paymentDate = refund.paymentDate ?? todayInSpain();
  if (!isCalendarDate(paymentDate)) {
    throw validationError(
      'Fecha de reembolso no válida',
      'settlement.refund.paymentDate',
      'Fecha inexistente'
    );
  }
  if (paymentDate > todayInSpain()) {
    throw fiscalRule(
      'La fecha del reembolso no puede ser posterior a hoy',
      'settlement.refund.paymentDate'
    );
  }
  return {
    cents: parseScaled(refund.amount, MONEY_SCALE),
    paymentMethod: refund.paymentMethod,
    paymentDate,
    reference: refund.reference,
  };
}

function assertSettlesTheReturn(settledCents: bigint, returnCents: bigint): void {
  if (settledCents !== returnCents) {
    throw fiscalRule(
      `Reembolso + compensación (${formatCents(settledCents)} €) debe ser el total de la ` +
        `rectificativa (${formatCents(returnCents)} €)`,
      'settlement'
    );
  }
}

function assertWithinOriginalDue(
  compensationCents: bigint,
  original: IntegrationInvoiceResponse
): void {
  const dueCents = toCents(Number(original.totals.total)) - toCents(Number(original.amountPaid));
  if (compensationCents > dueCents) {
    throw fiscalRule(
      `La compensación supera lo pendiente de cobro de la factura original (${formatCents(dueCents > 0n ? dueCents : 0n)} €)`,
      'settlement.compensation.amount'
    );
  }
}

function formatCents(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}

function toRefundPayment(refund: NonNullable<SettlementPlan['refund']>): CreatePaymentDto {
  const payment = new CreatePaymentDto();
  payment.amount = -Number(refund.cents) / 100;
  payment.paymentDate = refund.paymentDate;
  payment.paymentMethod = refund.paymentMethod;
  payment.reference = refund.reference;
  payment.notes = 'Reembolso de la devolución';
  return payment;
}

/** A compensation moves no money: method COMPENSATION, today, with a note naming the other invoice. */
function compensationPayment(amount: number, notes: string): CreatePaymentDto {
  const payment = new CreatePaymentDto();
  payment.amount = amount;
  payment.paymentDate = todayInSpain();
  payment.paymentMethod = PaymentMethod.COMPENSATION;
  payment.notes = notes;
  return payment;
}
