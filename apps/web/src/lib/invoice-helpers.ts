import {
  Invoice,
  LayoutOverride,
  InvoiceStatus,
  Customer,
  PaymentMethod,
  PaymentStatus,
  InvoiceSeries,
  RectificationType,
} from '@easyfactura/shared-types';
import { EQUIVALENCE_SURCHARGE_RATES } from '@easyfactura/shared-constants';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { round2 } from '@/lib/math';
import { ExtendedLineData, stripLineMetaFields } from '@/lib/invoice-line-types';

// ==================== HELPERS ====================

/**
 * Calcula la fecha de vencimiento sumando `days` días a `issueDate`.
 * Devuelve una string en formato ISO 'YYYY-MM-DD'.
 */
export function calculateDueDate(issueDate: Date, days: number): string {
  const due = new Date(issueDate);
  due.setDate(due.getDate() + days);
  return due.toISOString().split('T')[0];
}

// ==================== TYPES ====================

export interface InvoiceFormData {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  invoiceType?: string;
  seriesId?: string;
  templateId?: string;
  layoutOverride?: LayoutOverride;
  discountPercent?: number;
  irpfPercent?: number;
  /** Porcentaje de compensación agraria (solo REAGYP). Editado por el usuario en el formulario. */
  compensacionPercent?: number;
  paymentMethod?: PaymentMethod;
  paymentDetails?: Record<string, string | undefined>;
  notes?: string;
  lines: ExtendedLineData[];
}

export interface RectificativePreviewInfo {
  isRectificative: boolean;
  rectificationType: RectificationType | null;
  rectificationReason: string | null;
  rectifiedInvoiceId: string | null;
  rectifiedInvoice?: { id: string; number: string | null } | null;
}

// ==================== buildPreviewInvoice ====================

/**
 * Construye un objeto Invoice sintético para la vista previa en tiempo real.
 * No se persiste en base de datos — solo se usa para renderizar LiveInvoicePreview.
 *
 * @param compensacionPercent - Porcentaje de compensación agraria (solo REAGYP). Pass 0 or undefined for GENERAL.
 * @param equivalenceSurchargeRates - Recargo de Equivalencia rate map: { taxRate -> surchargeRate }. Pass empty or omit for GENERAL.
 */
export function buildPreviewInvoice(
  data: Partial<InvoiceFormData>,
  customers: Customer[],
  selectedSeries?: InvoiceSeries | null,
  compensacionPercent?: number,
  equivalenceSurchargeRates?: Record<number, number>,
  rectificativeInfo?: RectificativePreviewInfo,
): Invoice {
  const today = new Date().toISOString();
  const lines = data.lines ?? [];
  const customer = customers.find((c) => c.id === data.customerId);

  const subtotal = round2(
    lines.reduce((acc, l) => {
      // No intermediate round2 — preserve full unitPrice precision (up to 4 decimals)
      const grossSubtotal = (l.quantity ?? 0) * (l.unitPrice ?? 0);
      const lineDiscount = l.discountPercent ?? 0;
      return acc + (lineDiscount > 0 ? grossSubtotal * (1 - lineDiscount / 100) : grossSubtotal);
    }, 0),
  );

  const discountAmount = data.discountPercent ? round2(subtotal * (data.discountPercent / 100)) : 0;
  const subtotalAfterDiscount = round2(subtotal - discountAmount);
  const discFactor = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

  // ── REAGYP vs. GENERAL totals ──
  // isReagyp is true whenever compensacionPercent is explicitly set (even 0).
  // A value of 0 means: REAGYP invoice, no compensation rate (customer is already subject to REAGYP).
  // In this case IVA must still be hidden but the compensation row must not appear.
  const isReagyp = compensacionPercent != null;

  // ── Recargo de Equivalencia ──
  // The rate is FIXED BY LAW (Art. 161 LIVA) — users never input it. For the preview we
  // look up the rate from the LIVA map per line's taxRate. The backend re-computes the
  // same values and stamps them on the persisted invoice for traceability.
  const hasEquivalenceSurcharge =
    equivalenceSurchargeRates != null && Object.keys(equivalenceSurchargeRates).length > 0;
  const isSurchargeActive = hasEquivalenceSurcharge && !isReagyp;

  const taxTotal = isReagyp
    ? 0
    : round2(
        lines.reduce((acc, l) => {
          // No intermediate round2 — preserve full unitPrice precision
          const grossSubtotal = (l.quantity ?? 0) * (l.unitPrice ?? 0);
          const lineDiscount = l.discountPercent ?? 0;
          const lineNet =
            lineDiscount > 0 ? grossSubtotal * (1 - lineDiscount / 100) : grossSubtotal;
          return acc + lineNet * discFactor * ((l.taxRate ?? 0) / 100);
        }, 0),
      );

  const surchargeTotal = isSurchargeActive
    ? round2(
        lines.reduce((acc, l) => {
          const grossSubtotal = (l.quantity ?? 0) * (l.unitPrice ?? 0);
          const lineDiscount = l.discountPercent ?? 0;
          const lineNet =
            lineDiscount > 0 ? grossSubtotal * (1 - lineDiscount / 100) : grossSubtotal;
          // RE rate is always looked up from the LIVA map using the line's taxRate.
          // No user override — the rate is fixed by law.
          const rate = equivalenceSurchargeRates?.[l.taxRate ?? 0] ?? 0;
          return acc + lineNet * discFactor * (rate / 100);
        }, 0),
      )
    : 0;

  const previewCompensacionAmount = isReagyp
    ? round2(subtotalAfterDiscount * (compensacionPercent / 100))
    : 0;

  // IRPF base: for REAGYP it includes the compensation amount (Art. 102.Dos LIVA)
  const irpfBase = isReagyp
    ? round2(subtotalAfterDiscount + previewCompensacionAmount)
    : subtotalAfterDiscount;

  const irpfTotal = data.irpfPercent ? round2(irpfBase * (data.irpfPercent / 100)) : null;

  const total = round2(
    subtotalAfterDiscount +
      taxTotal +
      surchargeTotal +
      previewCompensacionAmount -
      (irpfTotal ?? 0),
  );

  const previewLines = lines.map((l, i) => {
    // Determine whether to hide the quantity for this line in the live preview:
    // - service: always hide (quantity is always 1 and not meaningful)
    // - product: always show
    // - custom: hide only when _hideQty=true (user left quantity blank)
    const hideQty = l._mode === 'service' || (l._mode === 'custom' && l._hideQty === true);
    // Respect negative/zero quantities so rectification previews reflect the real line values.
    const effectiveQty = l.quantity != null ? l.quantity : 1;
    // No intermediate round2 — preserve full unitPrice precision for accurate lineTotal
    const grossSubtotal = effectiveQty * (l.unitPrice ?? 0);
    const lineDiscount = l.discountPercent ?? 0;
    const lineSubtotal =
      lineDiscount > 0 ? grossSubtotal * (1 - lineDiscount / 100) : grossSubtotal;
    const lineSurchargeRate = isSurchargeActive
      ? (equivalenceSurchargeRates?.[l.taxRate ?? 0] ?? 0)
      : 0;
    const lineSurchargeAmount = isSurchargeActive
      ? round2(lineSubtotal * discFactor * (lineSurchargeRate / 100))
      : 0;
    return {
      id: `preview-${i}`,
      tenantId: '',
      invoiceId: 'preview',
      productId: l.productId ?? null,
      description: l.description || '',
      quantity: effectiveQty,
      unitPrice: l.unitPrice ?? 0,
      subtotal: lineSubtotal,
      discountPercent: lineDiscount > 0 ? lineDiscount : null,
      taxRate: l.taxRate ?? 0,
      taxAmount: round2(lineSubtotal * ((l.taxRate ?? 0) / 100)),
      surchargeRate: lineSurchargeRate > 0 ? lineSurchargeRate : null,
      surchargeAmount: lineSurchargeAmount > 0 ? lineSurchargeAmount : null,
      lineTotal: round2(lineSubtotal),
      hideQty,
      sortOrder: i,
      createdAt: today,
      updatedAt: today,
      _hideQty: hideQty,
    };
  });

  return {
    id: 'preview',
    tenantId: '',
    seriesId: '',
    customerId: data.customerId ?? '',
    number: selectedSeries
      ? formatSeriesPreview(selectedSeries.prefix, selectedSeries.year, selectedSeries.nextNumber)
      : '---',
    issueDate: data.issueDate || today.split('T')[0],
    dueDate: data.dueDate ?? null,
    status: InvoiceStatus.DRAFT,
    subtotal,
    discountPercent: data.discountPercent ?? null,
    discountAmount,
    taxTotal,
    surchargeTotal: surchargeTotal > 0 ? surchargeTotal : null,
    irpfPercent: data.irpfPercent ?? null,
    irpfTotal,
    compensacionPercent: isReagyp ? compensacionPercent : null,
    compensacionAmount: isReagyp ? previewCompensacionAmount : null,
    total,
    paymentMethod: data.paymentMethod ?? null,
    paymentDetails: data.paymentDetails ?? null,
    notes: data.notes ?? null,
    pdfUrl: null,
    verifactuHash: null,
    verifactuPrevHash: null,
    verifactuStatus: null,
    verifactuQr: null,
    verifactuSentAt: null,
    verifactuResponse: null,
    isRectificative: rectificativeInfo?.isRectificative ?? false,
    rectifiedInvoiceId: rectificativeInfo?.rectifiedInvoiceId ?? null,
    rectificationReason: rectificativeInfo?.rectificationReason ?? null,
    rectificationType: rectificativeInfo?.rectificationType ?? null,
    rectifiedInvoice: rectificativeInfo?.rectifiedInvoice ?? null,
    amountPaid: 0,
    paymentStatus: PaymentStatus.UNPAID,
    createdAt: today,
    updatedAt: today,
    customer: customer,
    lines: previewLines,
  } as Invoice;
}

// ==================== buildCreateInput ====================

/**
 * Transforma los datos del formulario al shape que espera la mutación de creación
 * (useCreateInvoice). Limpia valores vacíos para no enviar campos nulos innecesarios.
 */
export function buildCreateInput(data: InvoiceFormData) {
  return {
    customerId: data.customerId,
    seriesId: data.seriesId || undefined,
    templateId: data.templateId || undefined,
    layoutOverride: data.layoutOverride || undefined,
    issueDate: data.issueDate,
    dueDate: data.dueDate || undefined,
    invoiceType: data.invoiceType ?? 'standard',
    discountPercent: data.discountPercent || undefined,
    irpfPercent: data.irpfPercent || undefined,
    // Send the user's compensacion choice when it's explicitly set (even 0 means 'no compensation').
    // We only omit it entirely when the user hasn't interacted with a REAGYP tenant context.
    compensacionPercent:
      data.compensacionPercent !== undefined ? data.compensacionPercent : undefined,
    paymentMethod: data.paymentMethod,
    paymentDetails: data.paymentDetails,
    notes: data.notes,
    lines: data.lines.map((l) => {
      const clean = stripLineMetaFields(l);
      return {
        description: clean.description,
        quantity: clean.quantity,
        unitPrice: clean.unitPrice,
        discountPercent:
          clean.discountPercent && clean.discountPercent > 0 ? clean.discountPercent : undefined,
        taxRate: clean.taxRate,
        productId: clean.productId,
        hideQty: clean.hideQty,
      };
    }),
  };
}
