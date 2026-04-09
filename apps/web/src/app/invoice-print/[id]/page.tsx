import { headers } from 'next/headers';
import {
  Invoice,
  InvoiceLayout,
  InvoiceTemplate,
  LayoutOverride,
  Tenant,
  DEFAULT_INVOICE_LAYOUT,
} from '@easyfactura/shared-types';
import { HeaderBlock } from '@/components/invoice-preview/blocks/HeaderBlock';
import { ItemsTableBlock } from '@/components/invoice-preview/blocks/ItemsTableBlock';
import { TotalsBlock } from '@/components/invoice-preview/blocks/TotalsBlock';
import { FooterBlock } from '@/components/invoice-preview/blocks/FooterBlock';
import {
  PaymentDetailsBlock,
  type PaymentDetails,
} from '@/components/invoice-preview/blocks/PaymentDetailsBlock';

// ==================== CONSTANTS ====================

const FONT_FAMILY_MAP: Record<string, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  'times-roman': 'Times New Roman, Times, serif',
  courier: 'Courier New, Courier, monospace',
};

// ==================== HELPERS ====================

function resolveDocumentTitle(isRectificative: boolean, invoiceType?: string | null): string {
  if (isRectificative) return 'FACTURA RECTIFICATIVA';
  if (invoiceType === 'proforma') return 'FACTURA PROFORMA';
  if (invoiceType === 'simplified') return 'FACTURA SIMPLIFICADA';
  if (invoiceType === 'quote') return 'PRESUPUESTO';
  return 'FACTURA';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
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

function buildApiUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return base.replace(/\/v1$/, '') + '/v1';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchJson<T>(url: string, authHeader: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    // The NestJS API wraps all responses via TransformInterceptor: { success, data, meta }
    const body = (await res.json()) as ApiResponse<T>;
    return body.data ?? null;
  } catch {
    return null;
  }
}

// ==================== PAGE ====================

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', color: '#ef4444' }}>
        No autorizado
      </div>
    );
  }

  const apiUrl = buildApiUrl();

  const [invoice, defaultTemplate, tenant] = await Promise.all([
    fetchJson<Invoice>(`${apiUrl}/invoices/${id}`, authHeader),
    fetchJson<InvoiceTemplate>(`${apiUrl}/invoice-templates/default`, authHeader),
    fetchJson<Tenant>(`${apiUrl}/tenant`, authHeader),
  ]);

  if (!invoice) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', color: '#ef4444' }}>
        Factura no encontrada
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', color: '#ef4444' }}>
        Datos de empresa no encontrados
      </div>
    );
  }

  // Fetch the invoice's specific template if it has a templateId
  const invoiceTemplateId = (invoice as Invoice & { templateId?: string }).templateId;
  const specificTemplate = invoiceTemplateId
    ? await fetchJson<InvoiceTemplate>(
        `${apiUrl}/invoice-templates/${invoiceTemplateId}`,
        authHeader,
      )
    : null;

  const baseTemplate = specificTemplate ?? defaultTemplate;
  const baseLayout = (baseTemplate?.layout ?? DEFAULT_INVOICE_LAYOUT) as InvoiceLayout;

  // Apply per-invoice layoutOverride (e.g. simplifyTable toggle) on top of the template
  const invoiceLayoutOverride = invoice.layoutOverride as LayoutOverride | null | undefined;
  const layout: InvoiceLayout = invoiceLayoutOverride?.itemsTable
    ? {
        ...baseLayout,
        itemsTable: {
          ...baseLayout.itemsTable,
          ...invoiceLayoutOverride.itemsTable,
        },
      }
    : baseLayout;
  const { page, typography, colors } = layout;
  const fontFamily = FONT_FAMILY_MAP[typography.fontFamily] ?? FONT_FAMILY_MAP['helvetica'];
  const paymentDetails = invoice.paymentDetails as PaymentDetails | undefined;
  const documentTitle = resolveDocumentTitle(invoice.isRectificative ?? false, invoice.invoiceType);

  return (
    <>
      {/* Reset body styles — critical for Playwright PDF rendering */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: hidden !important;
          width: 595px !important;
        }
        @page { size: 595px 842px; margin: 0; }
        img { max-width: 100%; }
      `}</style>

      {/* A4 canvas — exact dimensions match the live preview */}
      <div
        style={{
          width: '595px',
          minHeight: '842px',
          backgroundColor: '#ffffff',
          paddingTop: `${page.marginTop * 2.83}px`,
          paddingRight: `${page.marginRight * 2.83}px`,
          paddingBottom: `${page.marginBottom * 2.83}px`,
          paddingLeft: `${page.marginLeft * 2.83}px`,
          fontFamily,
          fontSize: `${typography.baseFontSize}px`,
          color: colors.textPrimary,
          boxSizing: 'border-box',
        }}
      >
        {/* 1 — Header: sender + customer */}
        <HeaderBlock layout={layout} invoice={invoice} tenant={tenant} />

        <hr
          style={{
            borderColor: colors.tableHeader,
            margin: '16px 0',
            border: 'none',
            borderTop: `1px solid ${colors.tableHeader}`,
          }}
        />

        {/* 2 — Invoice title + dates */}
        <h1
          style={{
            fontSize: `${typography.baseFontSize + 8}px`,
            color: colors.primary,
            fontWeight: 700,
            marginBottom: '12px',
            marginTop: 0,
          }}
        >
          {documentTitle}
        </h1>
        <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
          <div>
            <p
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                fontWeight: 600,
                margin: '0 0 2px',
              }}
            >
              Número
            </p>
            <p style={{ fontWeight: 600, fontSize: '11px', margin: 0 }}>{invoice.number || '—'}</p>
          </div>
          <div>
            <p
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                fontWeight: 600,
                margin: '0 0 2px',
              }}
            >
              Fecha de emisión
            </p>
            <p style={{ fontWeight: 600, fontSize: '11px', margin: 0 }}>
              {formatDate(invoice.issueDate)}
            </p>
          </div>
          {invoice.dueDate && (
            <div>
              <p
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  fontWeight: 600,
                  margin: '0 0 2px',
                }}
              >
                Vencimiento
              </p>
              <p style={{ fontWeight: 600, fontSize: '11px', margin: 0 }}>
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          )}
        </div>

        {/* 3 — Items table */}
        <ItemsTableBlock layout={layout} invoice={invoice} />

        {/* 4 — Totals */}
        <div style={{ marginTop: '16px' }}>
          <TotalsBlock layout={layout} invoice={invoice} />
        </div>

        {/* 5 — Payment method */}
        {invoice.paymentMethod && (
          <div style={{ marginTop: '24px' }}>
            <PaymentDetailsBlock
              invoice={invoice}
              paymentDetails={paymentDetails}
              primaryColor={colors.primary}
            />
          </div>
        )}

        {/* 6 — Notes */}
        {invoice.notes && layout.notes?.show !== false && (
          <div
            style={{
              paddingTop: '10px',
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {layout.notes?.showLabel !== false && (
              <p
                style={{
                  fontSize: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Notas
              </p>
            )}
            <p style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* 7 — Footer */}
        <div style={{ marginTop: '16px' }}>
          <FooterBlock layout={layout} invoice={invoice} tenant={tenant} />
        </div>
      </div>
    </>
  );
}
