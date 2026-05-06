import {
  Invoice,
  InvoiceLayout,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@easyfactura/shared-types';

// ──────────────────────────── Palettes ────────────────────────────

export interface PresetPalette {
  name: string;
  recommended: boolean;
  primary: string;
  tableHeader: string;
  textPrimary: string;
  textSecondary: string;
}

export const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Azul profesional',
    recommended: true,
    primary: '#2563eb',
    tableHeader: '#dbeafe',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Verde esmeralda',
    recommended: false,
    primary: '#059669',
    tableHeader: '#d1fae5',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Gris elegante',
    recommended: false,
    primary: '#374151',
    tableHeader: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  {
    name: 'Rojo corporativo',
    recommended: false,
    primary: '#dc2626',
    tableHeader: '#fee2e2',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Violeta moderno',
    recommended: false,
    primary: '#7c3aed',
    tableHeader: '#ede9fe',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Naranja cálido',
    recommended: false,
    primary: '#ea580c',
    tableHeader: '#ffedd5',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
];

// ──────────────────────────── Table styles ────────────────────────────

export interface TableStyleOption {
  value: 'grid' | 'lines' | 'minimal';
  label: string;
  icon: string;
  desc: string;
}

export const TABLE_STYLES: TableStyleOption[] = [
  { value: 'grid', label: 'Cuadrícula', icon: '⊞', desc: 'Celdas con bordes' },
  { value: 'lines', label: 'Líneas', icon: '≡', desc: 'Solo horizontales' },
  { value: 'minimal', label: 'Limpia', icon: '—', desc: 'Sin bordes' },
];

// ──────────────────────────── Fonts ────────────────────────────

export interface FontOption {
  value: 'helvetica' | 'times-roman' | 'courier';
  label: string;
  preview: string;
  style: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'helvetica', label: 'Moderna', preview: 'Aa', style: 'font-sans' },
  { value: 'times-roman', label: 'Clásica', preview: 'Aa', style: 'font-serif' },
  { value: 'courier', label: 'Técnica', preview: 'Aa', style: 'font-mono' },
];

// ──────────────────────────── Base templates ────────────────────────────

export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  layout: Partial<InvoiceLayout>;
}

export const BASE_TEMPLATES: BaseTemplate[] = [
  {
    id: 'professional',
    name: 'Profesional',
    description: 'Seria y ordenada',
    layout: {
      colors: {
        primary: '#2563eb',
        tableHeader: '#dbeafe',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'grid',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-left', widthMm: 40 },
      header: { senderSide: 'left', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: false },
      footer: { text: 'Gracias por su confianza.', showPaymentInfo: true, showVerifactuQr: false },
    },
  },
  {
    id: 'modern',
    name: 'Moderna',
    description: 'Limpia y minimalista',
    layout: {
      colors: {
        primary: '#7c3aed',
        tableHeader: '#ede9fe',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'minimal',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-center', widthMm: 45 },
      header: { senderSide: 'left', showPhone: false, showIban: true },
      totals: { showTaxBreakdown: false, showIrpf: false },
      footer: { text: '', showPaymentInfo: true, showVerifactuQr: false },
    },
  },
  {
    id: 'classic',
    name: 'Clásica',
    description: 'Tradicional y formal',
    layout: {
      colors: {
        primary: '#374151',
        tableHeader: '#f3f4f6',
        textPrimary: '#111827',
        textSecondary: '#6b7280',
      },
      typography: { fontFamily: 'times-roman', baseFontSize: 11 },
      itemsTable: {
        style: 'lines',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-right', widthMm: 35 },
      header: { senderSide: 'left', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: true },
      footer: {
        text: 'Documento emitido conforme a la normativa fiscal vigente.',
        showPaymentInfo: true,
        showVerifactuQr: false,
      },
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrante',
    description: 'Llamativa y moderna',
    layout: {
      colors: {
        primary: '#059669',
        tableHeader: '#d1fae5',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'grid',
        showDiscount: true,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-left', widthMm: 50 },
      header: { senderSide: 'right', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: false },
      footer: {
        text: '¡Gracias por confiar en nosotros!',
        showPaymentInfo: true,
        showVerifactuQr: false,
      },
    },
  },
];

// ──────────────────────────── Example invoice ────────────────────────────

export function buildExampleInvoice(tenantId: string): Invoice {
  const now = new Date().toISOString();
  return {
    id: 'preview',
    tenantId,
    seriesId: 'preview',
    customerId: 'preview',
    number: 'FAC-2024-0001',
    issueDate: now,
    dueDate: null,
    status: InvoiceStatus.CONFIRMED,
    subtotal: 1000,
    discountPercent: null,
    discountAmount: null,
    taxTotal: 210,
    total: 1060,
    amountPaid: 0,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentDetails: null,
    notes: 'Gracias por su confianza.',
    irpfPercent: 15,
    irpfTotal: 150,
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
    createdAt: now,
    updatedAt: now,
    customer: {
      id: 'preview',
      tenantId,
      type: 'COMPANY' as never,
      name: 'Empresa Cliente S.L.',
      legalName: null,
      nif: 'B87654321',
      email: 'cliente@ejemplo.com',
      phone: null,
      address: 'Calle Gran Vía 28',
      postalCode: '28013',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      notes: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    lines: [
      {
        id: 'l1',
        tenantId,
        invoiceId: 'preview',
        productId: null,
        description: 'Servicio de consultoría estratégica',
        quantity: 8,
        unitPrice: 75,
        subtotal: 600,
        taxRate: 21,
        taxAmount: 126,
        lineTotal: 600,
        hideQty: false,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'l2',
        tenantId,
        invoiceId: 'preview',
        productId: null,
        description: 'Licencia de software anual',
        quantity: 1,
        unitPrice: 400,
        subtotal: 400,
        taxRate: 21,
        taxAmount: 84,
        lineTotal: 400,
        hideQty: false,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
