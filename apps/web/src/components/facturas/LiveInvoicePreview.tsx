'use client';

import { useState, useRef } from 'react';
import {
  Invoice,
  InvoiceLayout,
  InvoiceTemplate,
  Tenant,
  DEFAULT_INVOICE_LAYOUT,
  PaymentMethod,
} from '@easyfactura/shared-types';
import { HeaderBlock } from '@/components/invoice-preview/blocks/HeaderBlock';
import { ItemsTableBlock } from '@/components/invoice-preview/blocks/ItemsTableBlock';
import { TotalsBlock } from '@/components/invoice-preview/blocks/TotalsBlock';
import { FooterBlock } from '@/components/invoice-preview/blocks/FooterBlock';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.0;
const SCALE_STEP = 0.1;

const FONT_FAMILY_MAP: Record<string, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  'times-roman': 'Times New Roman, Times, serif',
  courier: 'Courier New, Courier, monospace',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia bancaria',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.OTHER]: 'Otro',
  BIZUM: 'Bizum',
};

// Fallback tenant for preview when tenant data is not yet loaded
const FALLBACK_TENANT: Tenant = {
  id: '',
  businessName: 'Tu empresa',
  legalName: null,
  nif: 'B00000000',
  address: 'Calle ejemplo, 1',
  postalCode: '28001',
  city: 'Madrid',
  province: 'Madrid',
  country: 'ES',
  phone: null,
  email: 'info@tuempresa.com',
  logoUrl: null,
  iban: null,
} as Tenant;

// ==================== TYPES ====================

export interface PaymentDetails {
  iban?: string;
  bic?: string;
  accountHolder?: string;
  bizumPhone?: string;
  paypalEmail?: string;
  paymentNote?: string;
}

// ==================== SECTION WRAPPER ====================

interface PreviewSectionProps {
  fieldId: string;
  label: string;
  activeFieldSection: string | null;
  onSectionClick: (fieldId: string) => void;
  children: React.ReactNode;
  className?: string;
}

function PreviewSection({
  fieldId,
  label,
  activeFieldSection,
  onSectionClick,
  children,
  className,
}: PreviewSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeFieldSection === fieldId;

  return (
    <div
      className={cn('relative cursor-pointer rounded-sm transition-all', className)}
      onClick={() => onSectionClick(fieldId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSectionClick(fieldId);
      }}
      title={`Hacer clic para editar: ${label}`}
    >
      {/* Highlight overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-sm pointer-events-none transition-all z-10',
          isActive && 'ring-2 ring-primary ring-offset-1 bg-primary/5',
          !isActive && isHovered && 'ring-2 ring-dashed ring-primary/50 bg-primary/3',
        )}
      />

      {/* Tooltip label */}
      {(isHovered || isActive) && (
        <div
          className={cn(
            'absolute -top-6 left-0 z-20 text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground border border-border',
          )}
        >
          {label}
        </div>
      )}

      {children}
    </div>
  );
}

// ==================== DATE FORMATTER ====================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ==================== PAYMENT DETAILS BLOCK ====================

interface PaymentDetailsBlockProps {
  invoice: Invoice;
  paymentDetails?: PaymentDetails;
  primaryColor: string;
}

function PaymentDetailsBlock({ invoice, paymentDetails, primaryColor }: PaymentDetailsBlockProps) {
  const method = invoice.paymentMethod as string | null;

  // No renderizar nada si no hay método seleccionado
  if (!method) return null;

  const methodLabel = PAYMENT_METHOD_LABELS[method] ?? method;
  const hasDetails =
    paymentDetails?.iban ||
    paymentDetails?.bizumPhone ||
    paymentDetails?.paypalEmail ||
    paymentDetails?.paymentNote ||
    paymentDetails?.accountHolder;

  return (
    <div
      style={{
        borderTop: `1.5px solid #e5e7eb`,
        paddingTop: '10px',
        marginTop: '12px',
      }}
    >
      {/* Encabezado de sección */}
      <p
        style={{
          fontSize: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b7280',
          fontWeight: 600,
          marginBottom: '6px',
        }}
      >
        Forma de pago
      </p>

      {/* Método */}
      <p
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: primaryColor,
          marginBottom: hasDetails ? '6px' : '0',
        }}
      >
        {methodLabel}
      </p>

      {/* ── Transferencia bancaria ── */}
      {method === PaymentMethod.BANK_TRANSFER && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {paymentDetails?.iban && (
            <p
              style={{
                fontSize: '11px',
                fontFamily: 'Courier New, Courier, monospace',
                letterSpacing: '0.05em',
                color: '#111827',
                fontWeight: 600,
              }}
            >
              {paymentDetails.iban}
            </p>
          )}
          {paymentDetails?.accountHolder && (
            <p style={{ fontSize: '9px', color: '#6b7280' }}>
              Titular: {paymentDetails.accountHolder}
            </p>
          )}
          {paymentDetails?.bic && (
            <p
              style={{
                fontSize: '9px',
                color: '#6b7280',
                fontFamily: 'Courier New, Courier, monospace',
              }}
            >
              BIC/SWIFT: {paymentDetails.bic}
            </p>
          )}
          {!paymentDetails?.iban && (
            <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
              Añade tu IBAN en el formulario
            </p>
          )}
        </div>
      )}

      {/* ── Bizum ── */}
      {method === 'BIZUM' && (
        <div>
          {paymentDetails?.bizumPhone ? (
            <p
              style={{
                fontSize: '11px',
                fontFamily: 'Courier New, Courier, monospace',
                letterSpacing: '0.05em',
                color: '#111827',
                fontWeight: 600,
              }}
            >
              {paymentDetails.bizumPhone}
            </p>
          ) : (
            <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
              Añade tu número de teléfono en el formulario
            </p>
          )}
        </div>
      )}

      {/* ── PayPal ── */}
      {method === PaymentMethod.PAYPAL && (
        <div>
          {paymentDetails?.paypalEmail ? (
            <p style={{ fontSize: '10px', color: '#1d4ed8' }}>{paymentDetails.paypalEmail}</p>
          ) : (
            <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
              Añade tu email o enlace de PayPal en el formulario
            </p>
          )}
        </div>
      )}

      {/* ── Domiciliación bancaria ── */}
      {method === PaymentMethod.DIRECT_DEBIT && (
        <div>
          <p style={{ fontSize: '9px', color: '#6b7280' }}>
            El importe se cargará automáticamente en la cuenta del cliente en la fecha de
            vencimiento.
          </p>
          {paymentDetails?.paymentNote && (
            <p style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
              Ref. SEPA: {paymentDetails.paymentNote}
            </p>
          )}
        </div>
      )}

      {/* ── Tarjeta ── */}
      {method === PaymentMethod.CARD && paymentDetails?.paymentNote && (
        <p style={{ fontSize: '9px', color: '#6b7280' }}>{paymentDetails.paymentNote}</p>
      )}

      {/* ── Efectivo ── */}
      {method === PaymentMethod.CASH && (
        <p style={{ fontSize: '9px', color: '#6b7280' }}>
          Límite legal: 1.000 € entre empresarios / 2.500 € con particulares.
        </p>
      )}

      {/* ── Otro ── */}
      {method === PaymentMethod.OTHER && paymentDetails?.paymentNote && (
        <p style={{ fontSize: '9px', color: '#6b7280' }}>{paymentDetails.paymentNote}</p>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

interface LiveInvoicePreviewProps {
  invoice: Invoice;
  template: InvoiceTemplate | null;
  tenant: Tenant | null;
  activeFieldSection?: string | null;
  onSectionClick: (fieldId: string) => void;
  paymentDetails?: PaymentDetails;
  /** 'standard' | 'proforma' | 'simplified' | 'template' | null */
  invoiceType?: string | null;
}

function resolveDocumentTitle(isRectificative: boolean, invoiceType?: string | null): string {
  if (isRectificative) return 'FACTURA RECTIFICATIVA';
  if (invoiceType === 'proforma') return 'FACTURA PROFORMA';
  if (invoiceType === 'simplified') return 'FACTURA SIMPLIFICADA';
  return 'FACTURA';
}

export function LiveInvoicePreview({
  invoice,
  template,
  tenant,
  activeFieldSection = null,
  onSectionClick,
  paymentDetails,
  invoiceType,
}: LiveInvoicePreviewProps) {
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = (template?.layout ?? DEFAULT_INVOICE_LAYOUT) as InvoiceLayout;
  const { page, typography, colors } = layout;
  const fontFamily = FONT_FAMILY_MAP[typography.fontFamily] ?? FONT_FAMILY_MAP['helvetica'];
  const effectiveTenant = tenant ?? FALLBACK_TENANT;

  const handleZoomIn = () =>
    setScale((s) => Math.min(MAX_SCALE, Math.round((s + SCALE_STEP) * 10) / 10));
  const handleZoomOut = () =>
    setScale((s) => Math.max(MIN_SCALE, Math.round((s - SCALE_STEP) * 10) / 10));

  return (
    <div className="flex flex-col h-full">
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-xs text-muted-foreground font-medium">Vista previa</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview scrollable area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
        {/* Scaled A4 document */}
        <div
          style={{
            width: `${595 * scale}px`,
            height: `${842 * scale}px`,
            minHeight: `${842 * scale}px`,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '595px',
              minHeight: '842px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              backgroundColor: '#fff',
              paddingTop: `${page.marginTop * 2.83}px`,
              paddingRight: `${page.marginRight * 2.83}px`,
              paddingBottom: `${page.marginBottom * 2.83}px`,
              paddingLeft: `${page.marginLeft * 2.83}px`,
              fontFamily,
              fontSize: `${typography.baseFontSize}px`,
              color: colors.textPrimary,
              boxSizing: 'border-box' as const,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              position: 'relative' as const,
            }}
          >
            {/* 1 — Header: sender + customer */}
            <PreviewSection
              fieldId="customerId"
              label="Cliente y emisor"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
            >
              <HeaderBlock layout={layout} invoice={invoice} tenant={effectiveTenant} />
            </PreviewSection>

            <hr className="my-4" style={{ borderColor: colors.tableHeader }} />

            {/* 2 — Invoice title + dates */}
            <PreviewSection
              fieldId="issueDate"
              label="Fechas y número"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
              className="mb-4"
            >
              <h1
                className="font-bold mb-3"
                style={{ fontSize: `${typography.baseFontSize + 8}px`, color: colors.primary }}
              >
                {resolveDocumentTitle(invoice.isRectificative ?? false, invoiceType)}
              </h1>
              <div className="flex gap-8">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Número</p>
                  <p className="font-semibold text-[11px]">{invoice.number || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Fecha de emisión
                  </p>
                  <p className="font-semibold text-[11px]">{formatDate(invoice.issueDate)}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
                      Vencimiento
                    </p>
                    <p className="font-semibold text-[11px]">{formatDate(invoice.dueDate)}</p>
                  </div>
                )}
              </div>
            </PreviewSection>

            {/* 3 — Items table */}
            <PreviewSection
              fieldId="lines-section"
              label="Líneas de factura"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
            >
              <ItemsTableBlock layout={layout} invoice={invoice} />
            </PreviewSection>

            {/* 4 — Totals + discount */}
            <PreviewSection
              fieldId="discountPercent"
              label="Totales y descuentos"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
              className="mt-4"
            >
              <TotalsBlock layout={layout} invoice={invoice} />
            </PreviewSection>

            {/* 5 — Payment method + details */}
            <PreviewSection
              fieldId="paymentMethod"
              label="Forma de pago"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
            >
              <PaymentDetailsBlock
                invoice={invoice}
                paymentDetails={paymentDetails}
                primaryColor={colors.primary}
              />
            </PreviewSection>

            {/* 6 — Notes */}
            {invoice.notes && (
              <PreviewSection
                fieldId="notes"
                label="Notas"
                activeFieldSection={activeFieldSection}
                onSectionClick={onSectionClick}
                className="mt-4"
              >
                <p className="text-[9px] uppercase tracking-wide text-gray-500 mb-1">Notas</p>
                <p className="text-[10px] text-gray-600">{invoice.notes}</p>
              </PreviewSection>
            )}

            {/* 7 — Footer */}
            <PreviewSection
              fieldId="footer"
              label="Pie de página"
              activeFieldSection={activeFieldSection}
              onSectionClick={onSectionClick}
              className="mt-4"
            >
              <FooterBlock layout={layout} invoice={invoice} tenant={effectiveTenant} />
            </PreviewSection>
          </div>
        </div>
      </div>
    </div>
  );
}
