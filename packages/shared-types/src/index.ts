// ==================== ENUMS ====================

export enum Plan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum AccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  AGENCY = 'AGENCY',
  COLLABORATIVE = 'COLLABORATIVE',
}

export enum TenantUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  INTRACOMMUNITY = 'INTRACOMMUNITY',
}

export enum ProductType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum SeriesType {
  INVOICE = 'INVOICE',
  RECTIFICATIVE = 'RECTIFICATIVE',
  QUOTE = 'QUOTE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PROFORMA = 'PROFORMA',
  QUOTE = 'QUOTE',
  CONFIRMED = 'CONFIRMED',
  SENT = 'SENT',
  PAID = 'PAID',
  RECTIFIED = 'RECTIFIED',
}

export enum QuoteAcceptanceStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}

export enum VerifactuStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  ACCEPTED = 'ACCEPTED',
  ACCEPTED_WITH_WARNINGS = 'ACCEPTED_WITH_WARNINGS',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  CARD = 'CARD',
  CASH = 'CASH',
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER',
  BIZUM = 'BIZUM',
}

// ==================== BASE TYPES ====================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
}

// ==================== TENANT ====================

export interface Tenant {
  id: string;
  businessName: string;
  legalName: string | null;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  phone: string | null;
  email: string;
  logoUrl: string | null;
  iban: string | null;
  bankAccountHolder: string | null;
  bic?: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
  setupCompleted: boolean;
  accountType: AccountType;
  plan: Plan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantUserRole;
  isOwner: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  user?: User;
}

export interface CreateTenantInput {
  businessName: string;
  legalName?: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country?: string;
  phone?: string;
  email: string;
}

export interface UpdateTenantInput {
  businessName?: string;
  legalName?: string;
  nif?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  iban?: string;
  bankAccountHolder?: string;
  bic?: string;
  accountType?: AccountType;
}

// ==================== USER ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  lastActiveTenantId: string | null;
  createdAt: string;
  updatedAt: string;
  tenants?: TenantUser[]; // Tenants asociados al usuario
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// ==================== AUTH ====================

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  nif: string;
  accountType: AccountType;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantId?: string; // Opcional: si el usuario tiene múltiples tenants
}

export interface AuthResponse {
  user: User;
  tenants: Array<{
    tenant: Tenant;
    role: TenantUserRole;
    isOwner: boolean;
  }>;
  currentTenant: Tenant; // El tenant activo/seleccionado
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface SwitchTenantInput {
  tenantId: string;
}

// ==================== CUSTOMER ====================

export interface Customer {
  id: string;
  tenantId: string;
  type: CustomerType;
  name: string;
  legalName: string | null;
  nif: string;
  email: string | null;
  phone: string | null;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  type: CustomerType;
  name: string;
  legalName?: string;
  nif: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  type?: CustomerType;
  name?: string;
  legalName?: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

export interface QueryCustomersInput {
  page?: number;
  limit?: number;
  search?: string;
  type?: CustomerType;
  active?: boolean;
  nif?: string;
}

// ==================== PRODUCT ====================

export interface Product {
  id: string;
  tenantId: string;
  type: ProductType;
  name: string;
  description: string | null;
  reference: string | null;
  unitPrice: number;
  taxRate: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  type: ProductType;
  name: string;
  description?: string;
  reference?: string;
  unitPrice: number;
  taxRate: number;
  unit?: string;
}

export interface UpdateProductInput {
  type?: ProductType;
  name?: string;
  description?: string;
  reference?: string;
  unitPrice?: number;
  taxRate?: number;
  unit?: string;
  isActive?: boolean;
}

export interface QueryProductsInput {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProductType;
  isActive?: boolean;
}

// ==================== INVOICE SERIES ====================

export interface InvoiceSeries {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: SeriesType;
  prefix: string;
  nextNumber: number;
  digits: number;
  year: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceSeriesInput {
  code: string;
  name: string;
  type: SeriesType;
  prefix: string;
  year: number;
  isDefault?: boolean;
  nextNumber?: number;
}

export interface UpdateInvoiceSeriesInput {
  name?: string;
  prefix?: string;
  isDefault?: boolean;
  nextNumber?: number;
}

// ==================== INVOICE ====================

export interface InvoiceLine {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  /** Whether to hide the quantity column for this line in the invoice preview/PDF */
  hideQty: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  seriesId: string;
  customerId: string;
  /**
   * Tipo de factura: 'standard' | 'proforma' | 'simplified' | 'quote'
   * Por defecto 'standard'. Solo las proformas y presupuestos pueden convertirse a oficial.
   */
  invoiceType?: string | null;
  /** Fecha límite de validez del presupuesto (solo relevante cuando invoiceType = 'quote') */
  validUntil?: string | null;
  /** Estado de aceptación del presupuesto (solo relevante cuando invoiceType = 'quote') */
  quoteAcceptanceStatus?: QuoteAcceptanceStatus | null;
  /** ID de la factura/proforma generada al convertir el presupuesto */
  convertedToInvoiceId?: string | null;
  /**
   * ID de la plantilla asociada a la factura (puede ser null si legacy)
   */
  templateId?: string | null;
  /**
   * Override parcial del layout de la plantilla (almacenado por factura).
   * Permite que configuraciones como "simplificar tabla" se persistan por factura
   * sin modificar la plantilla global del tenant.
   */
  layoutOverride?: LayoutOverride | null;
  /**
   * Plantilla asociada (opcional, solo si se incluye en el include de Prisma)
   */
  template?: InvoiceTemplate | null;
  number: string | null;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discountPercent: number | null;
  discountAmount: number | null;
  taxTotal: number;
  irpfPercent: number | null;
  irpfTotal: number | null;
  total: number;
  paymentMethod: PaymentMethod | null;
  paymentDetails: Record<string, any> | null;
  notes: string | null;
  pdfUrl: string | null;
  verifactuHash: string | null;
  verifactuPrevHash: string | null;
  verifactuStatus: VerifactuStatus | null;
  verifactuQr: string | null;
  verifactuSentAt: string | null;
  verifactuResponse: unknown;
  isRectificative: boolean;
  rectifiedInvoiceId: string | null;
  rectificationReason: string | null;
  /** ID of the recurring invoice that generated this invoice (or from which this was converted) */
  recurringInvoiceId?: string | null;
  createdAt: string;
  updatedAt: string;
  series?: InvoiceSeries;
  customer?: Customer;
  lines?: InvoiceLine[];
}

export interface CreateInvoiceLineInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  /** Whether to hide the quantity in the invoice preview/PDF */
  hideQty?: boolean;
}

export interface CreateInvoiceInput {
  customerId: string;
  seriesId?: string;
  issueDate: string;
  dueDate?: string;
  lines: CreateInvoiceLineInput[];
  /** Tipo de factura: 'standard' | 'proforma' | 'simplified' | 'quote'. Por defecto 'standard'. */
  invoiceType?: string;
  /** Fecha límite de validez (solo presupuestos). Formato YYYY-MM-DD. */
  validUntil?: string;
  discountPercent?: number;
  irpfPercent?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  /**
   * Detalles adicionales del método de pago (según tipo)
   */
  paymentDetails?: Record<string, any>;
  /**
   * Override parcial del layout de plantilla para esta factura concreta.
   * Se persiste en la BD y se aplica al generar el PDF.
   */
  layoutOverride?: LayoutOverride;
}

export interface UpdateInvoiceInput {
  customerId?: string;
  seriesId?: string;
  issueDate?: string;
  dueDate?: string;
  lines?: CreateInvoiceLineInput[];
  /** Tipo de factura: 'standard' | 'proforma' | 'simplified' | 'quote'. */
  invoiceType?: string;
  /** Fecha límite de validez (solo presupuestos). Formato YYYY-MM-DD. */
  validUntil?: string;
  /** Estado de aceptación del presupuesto */
  quoteAcceptanceStatus?: QuoteAcceptanceStatus;
  discountPercent?: number;
  irpfPercent?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  /**
   * Detalles adicionales del método de pago (según tipo)
   */
  paymentDetails?: Record<string, any>;
  /**
   * Override parcial del layout de plantilla para esta factura concreta.
   */
  layoutOverride?: LayoutOverride;
}

export interface QueryInvoicesInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'number' | 'issueDate' | 'total' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ConfirmInvoiceInput {
  invoiceId: string;
}

export interface RectifyInvoiceInput {
  invoiceId: string;
  reason: string;
  lines: CreateInvoiceLineInput[];
}

// ==================== VERIFACTU ====================

export interface VerifactuLog {
  id: string;
  tenantId: string;
  invoiceId: string;
  action: string;
  requestXml: string | null;
  responseXml: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  attempt: number;
  createdAt: string;
}

export interface QueryVerifactuLogsInput {
  page?: number;
  limit?: number;
  invoiceId?: string;
  status?: VerifactuStatus;
}

// ==================== INVOICE TEMPLATES ====================

export interface InvoiceLayout {
  version: 1;
  page: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  };
  typography: {
    fontFamily: 'helvetica' | 'times-roman' | 'courier';
    baseFontSize: number;
  };
  colors: {
    primary: string;
    tableHeader: string;
    textPrimary: string;
    textSecondary: string;
  };
  logo: {
    visible: boolean;
    position: 'top-left' | 'top-right' | 'top-center';
    widthMm: number;
  };
  header: {
    senderSide: 'left' | 'right';
    showPhone: boolean;
    showIban: boolean;
  };
  itemsTable: {
    style: 'grid' | 'lines' | 'minimal';
    showDiscount: boolean;
    showReference: boolean;
    showUnitPrice: boolean;
    showTaxColumn: boolean;
    showLineTotal: boolean;
  };
  totals: {
    showTaxBreakdown: boolean;
    showIrpf: boolean;
  };
  footer: {
    text: string;
    showPaymentInfo: boolean;
    showVerifactuQr: boolean;
  };
  notes?: {
    show: boolean;
    showLabel: boolean;
  };
}

export type LayoutOverride = {
  itemsTable?: Partial<InvoiceLayout['itemsTable']>;
};

// ==================== INVOICE DEFAULTS ====================

export interface InvoiceDefaults {
  id: string;
  tenantId: string;
  paymentMethod?: string | null;
  paymentDetails?: {
    iban?: string;
    bic?: string;
    accountHolder?: string;
    bizumPhone?: string;
    paypalEmail?: string;
    paymentNote?: string;
  } | null;
  irpfPercent?: number | null;
  dueDays?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_INVOICE_LAYOUT: InvoiceLayout = {
  version: 1,
  page: { marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20 },
  typography: { fontFamily: 'helvetica', baseFontSize: 10 },
  colors: {
    primary: '#1a56db',
    tableHeader: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  logo: { visible: true, position: 'top-left', widthMm: 40 },
  header: { senderSide: 'left', showPhone: true, showIban: false },
  itemsTable: {
    style: 'lines',
    showDiscount: false,
    showReference: false,
    showUnitPrice: true,
    showTaxColumn: true,
    showLineTotal: true,
  },
  totals: { showTaxBreakdown: true, showIrpf: true },
  footer: {
    text: 'Gracias por confiar en nosotros.',
    showPaymentInfo: true,
    showVerifactuQr: true,
  },
  notes: { show: true, showLabel: true },
};

export interface InvoiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  layout: InvoiceLayout;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceTemplateInput {
  name?: string;
  layout: InvoiceLayout;
  isDefault?: boolean;
}

// ==================== RECURRING INVOICES ====================

export enum Frequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
}

export enum RecurringStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface RecurringInvoiceLine {
  id: string;
  tenantId: string;
  recurringInvoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  irpfRate: number | null;
  hideQty: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoice {
  id: string;
  tenantId: string;
  customerId: string;
  seriesId: string | null;
  frequency: Frequency;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  autoConfirm: boolean;
  status: RecurringStatus;
  discountPercent: number | null;
  irpfPercent: number | null;
  paymentMethod: PaymentMethod | null;
  paymentDetails: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  series?: InvoiceSeries;
  lines?: RecurringInvoiceLine[];
}

export interface CreateRecurringInvoiceLineInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  irpfRate?: number;
  hideQty?: boolean;
}

export interface CreateRecurringInvoiceInput {
  customerId: string;
  seriesId?: string;
  frequency: Frequency;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  autoConfirm?: boolean;
  discountPercent?: number;
  irpfPercent?: number;
  paymentMethod?: PaymentMethod;
  paymentDetails?: Record<string, unknown>;
  notes?: string;
  lines: CreateRecurringInvoiceLineInput[];
  /** When provided, links this original invoice to the new recurring invoice */
  sourceInvoiceId?: string;
}

export interface UpdateRecurringInvoiceInput {
  frequency?: Frequency;
  dayOfMonth?: number;
  endDate?: string | null;
  autoConfirm?: boolean;
  discountPercent?: number | null;
  irpfPercent?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentDetails?: Record<string, unknown> | null;
  notes?: string | null;
  lines?: CreateRecurringInvoiceLineInput[];
}

export interface QueryRecurringInvoicesInput {
  page?: number;
  limit?: number;
  status?: RecurringStatus;
  customerId?: string;
}

export interface UpdateInvoiceTemplateInput {
  name?: string;
  isDefault?: boolean;
  layout?: Partial<InvoiceLayout>;
}

// ==================== REPORTS ====================

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  pendingRevenue: number;
  monthlyRevenue: number;
  monthlyInvoices: number;
  revenueGrowth: number;
  invoicesGrowth: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface CustomerReportData {
  customerId: string;
  customerName: string;
  totalInvoices: number;
  totalRevenue: number;
  lastInvoiceDate: string;
}

export interface QuarterlyReport {
  quarter: string;
  year: number;
  totalRevenue: number;
  totalTax: number;
  totalIrpf: number;
  invoicesCount: number;
}
