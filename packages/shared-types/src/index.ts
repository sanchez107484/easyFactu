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
  PUBLIC_ENTITY = 'PUBLIC_ENTITY',
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

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum PaymentType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
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

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
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

export enum AgencyClientStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export enum AgencyInvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  paymentDetails: Record<string, unknown> | null;
  amountPaid: number;
  paymentStatus: PaymentStatus;
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
  amountPaid: number;
  paymentStatus: PaymentStatus;
  /** ID of the recurring invoice that generated this invoice (or from which this was converted) */
  recurringInvoiceId?: string | null;
  createdAt: string;
  updatedAt: string;
  series?: InvoiceSeries;
  customer?: Customer;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

// ==================== PAYMENT ====================

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreatePaymentInput {
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface CreateInvoiceLineInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  /** Whether to hide the quantity in the invoice preview/PDF */
  hideQty?: boolean;
  /** Per-line IRPF withholding rate (%) */
  irpfRate?: number;
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
  paymentStatus?: PaymentStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  quoteAcceptanceStatus?: QuoteAcceptanceStatus;
  sortBy?: 'number' | 'issueDate' | 'dueDate' | 'total' | 'createdAt' | 'customer' | 'validUntil';
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
    defaultText?: string;
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
  /** Computed by the list endpoint — total per generation including tax minus IRPF. */
  estimatedTotal?: number;
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
  search?: string;
}

export interface RecurringGeneratedInvoice {
  id: string;
  number: string | null;
  issueDate: string;
  status: InvoiceStatus;
  total: number;
}

export interface RecurringGenerateResult {
  invoiceId: string;
  invoiceNumber: string | null;
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

// ==================== INVOICE STATS & REPORTS (API endpoints) ====================

export interface InvoiceStats {
  billedThisMonth: number;
  billedLastMonth: number;
  pendingCollection: number;
  invoicesThisMonth: number;
  monthlyChart: Array<{ month: string; importe: number }>;
  totalCustomers: number;
  totalProducts: number;
}

export interface InvoiceReportMonthly {
  month: string;
  revenue: number;
  invoices: number;
}

export interface InvoiceReportCustomer {
  id: string;
  name: string;
  invoices: number;
  total: number;
}

export interface InvoiceReportData {
  monthlyRevenue: InvoiceReportMonthly[];
  topCustomers: InvoiceReportCustomer[];
  taxSummary: {
    totalSubtotal: number;
    totalIva: number;
    totalIrpf: number;
    invoicesCount: number;
  };
}

export interface QueryReportsInput {
  fromDate: string;
  toDate: string;
}

// ==================== AGENCY ====================

export interface AgencyClientRelation {
  id: string;
  agencyTenantId: string;
  clientTenantId: string;
  status: AgencyClientStatus;
  addedByUserId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  clientTenant?: Tenant;
  agencyTenant?: Tenant;
}

export interface AgencyClientWithDetails extends AgencyClientRelation {
  clientTenant: Tenant;
  stats?: {
    totalInvoices: number;
    pendingInvoices: number;
    monthlyRevenue: number;
    lastActivity: string | null;
  };
}

export interface AgencyInvitation {
  id: string;
  agencyTenantId: string;
  inviteeEmail: string;
  inviteeName: string | null;
  token: string;
  status: AgencyInvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDirectClientInput {
  businessName: string;
  nif: string;
  email: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  phone?: string;
  notes?: string;
}

export interface InviteClientInput {
  inviteeEmail: string;
  inviteeName?: string;
}

export interface QueryAgencyClientsInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: AgencyClientStatus;
}

export interface AgencyClientRecentInvoice {
  id: string;
  number: string | null;
  issueDate: string;
  total: number;
  status: InvoiceStatus;
  customer: { name: string } | null;
}

export interface AgencyClientDetail extends Omit<
  AgencyClientRelation,
  'clientTenant' | 'agencyTenant'
> {
  clientTenant: Pick<
    Tenant,
    | 'id'
    | 'businessName'
    | 'nif'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'province'
    | 'postalCode'
    | 'setupCompleted'
    | 'isActive'
    | 'createdAt'
  >;
  stats: {
    totalInvoices: number;
    pendingInvoices: number;
    monthlyRevenue: number;
  };
  recentInvoices: AgencyClientRecentInvoice[];
}

// ==================== AGENCY STATS ====================

export interface AgencyDashboardAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  count: number;
}

export interface AgencyStats {
  totalClients: number;
  activeClients: number;
  pendingInvitations: number;
  clientsNeedingAttention: number;
  monthlyRevenue: number;
  alerts: AgencyDashboardAlert[];
}

// ==================== AGENCY EXPORT ====================

export enum ExportFormat {
  CONTAPLUS = 'CONTAPLUS',
  A3CON = 'A3CON',
  EXCEL = 'EXCEL',
}

export interface AgencyExportLog {
  id: string;
  agencyTenantId: string;
  clientTenantId: string;
  requestedByUserId: string;
  format: ExportFormat;
  year: number;
  quarter: number | null;
  invoicesCount: number;
  totalRevenue: number;
  createdAt: string;
}

export interface ExportContaPlusInput {
  year: number;
  quarter?: number;
}

// ==================== FISCAL VALIDATION ====================

export interface FiscalAlert {
  type: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface FiscalAlertSummaryItem {
  clientTenantId: string;
  clientName: string;
  nif: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export interface AgencyExportLogEntry {
  id: string;
  clientTenantId: string;
  format: ExportFormat;
  year: number;
  quarter: number | null;
  invoicesCount: number;
  totalRevenue: number;
  createdAt: string;
  requestedByUser: { name: string; email: string } | null;
  clientTenant: { businessName: string } | null;
}
