import { Invoice, InvoiceStatus, Customer, PaymentMethod } from '@easyfactura/shared-types';
import { round2 } from '@/lib/math';

// ==================== TYPES ====================

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  productId?: string;
}

export interface InvoiceFormData {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  discountPercent?: number;
  irpfPercent?: number;
  paymentMethod?: PaymentMethod;
  paymentDetails?: Record<string, string | undefined>;
  notes?: string;
  lines: InvoiceLine[];
}

// ==================== buildPreviewInvoice ====================

/**
 * Construye un objeto Invoice sintético para la vista previa en tiempo real.
 * No se persiste en base de datos — solo se usa para renderizar LiveInvoicePreview.
 */
export function buildPreviewInvoice(
  data: Partial<InvoiceFormData>,
  customers: Customer[],
): Invoice {
  const today = new Date().toISOString();
  const lines = data.lines ?? [];
  const customer = customers.find((c) => c.id === data.customerId);

  const subtotal = round2(
    lines.reduce((acc, l) => acc + round2((l.quantity ?? 0) * (l.unitPrice ?? 0)), 0),
  );

  const discountAmount = data.discountPercent ? round2(subtotal * (data.discountPercent / 100)) : 0;
  const subtotalAfterDiscount = round2(subtotal - discountAmount);
  const discFactor = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

  const taxTotal = round2(
    lines.reduce((acc, l) => {
      const base = round2((l.quantity ?? 0) * (l.unitPrice ?? 0));
      return acc + round2(base * discFactor * ((l.taxRate ?? 0) / 100));
    }, 0),
  );

  const irpfTotal = data.irpfPercent
    ? round2(subtotalAfterDiscount * (data.irpfPercent / 100))
    : null;

  const total = round2(subtotalAfterDiscount + taxTotal - (irpfTotal ?? 0));

  const previewLines = lines.map((l, i) => {
    const lineSubtotal = round2((l.quantity ?? 0) * (l.unitPrice ?? 0));
    return {
      id: `preview-${i}`,
      tenantId: '',
      invoiceId: 'preview',
      productId: l.productId ?? null,
      description: l.description || '',
      quantity: l.quantity ?? 0,
      unitPrice: l.unitPrice ?? 0,
      subtotal: lineSubtotal,
      taxRate: l.taxRate ?? 0,
      taxAmount: round2(lineSubtotal * ((l.taxRate ?? 0) / 100)),
      lineTotal: round2(lineSubtotal * (1 + (l.taxRate ?? 0) / 100)),
      sortOrder: i,
      createdAt: today,
      updatedAt: today,
    };
  });

  return {
    id: 'preview',
    tenantId: '',
    seriesId: '',
    customerId: data.customerId ?? '',
    number: '---',
    issueDate: data.issueDate || today.split('T')[0],
    dueDate: data.dueDate ?? null,
    status: InvoiceStatus.DRAFT,
    subtotal,
    discountPercent: data.discountPercent ?? null,
    discountAmount,
    taxTotal,
    irpfPercent: data.irpfPercent ?? null,
    irpfTotal,
    total,
    paymentMethod: data.paymentMethod ?? null,
    notes: data.notes ?? null,
    pdfUrl: null,
    verifactuHash: null,
    verifactuPrevHash: null,
    verifactuStatus: null,
    verifactuQr: null,
    verifactuSentAt: null,
    verifactuResponse: null,
    isRectificative: false,
    rectifiedInvoiceId: null,
    rectificationReason: null,
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
    issueDate: data.issueDate,
    dueDate: data.dueDate || undefined,
    discountPercent: data.discountPercent || undefined,
    irpfPercent: data.irpfPercent || undefined,
    paymentMethod: data.paymentMethod,
    paymentDetails: data.paymentDetails,
    notes: data.notes,
    lines: data.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      productId: l.productId,
    })),
  };
}
