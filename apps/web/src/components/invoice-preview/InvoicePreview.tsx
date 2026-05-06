import { Invoice, InvoiceLayout, InvoiceTemplate, Tenant } from '@easyfactura/shared-types';
import { DEFAULT_INVOICE_LAYOUT } from '@easyfactura/shared-types';
import { HeaderBlock } from './blocks/HeaderBlock';
import { ItemsTableBlock } from './blocks/ItemsTableBlock';
import { TotalsBlock } from './blocks/TotalsBlock';
import { FooterBlock } from './blocks/FooterBlock';

interface InvoicePreviewProps {
  invoice: Invoice;
  template: InvoiceTemplate;
  tenant: Tenant;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const FONT_FAMILY_MAP: Record<string, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  'times-roman': 'Times New Roman, Times, serif',
  courier: 'Courier New, Courier, monospace',
};

export function InvoicePreview({ invoice, template, tenant }: InvoicePreviewProps) {
  const layout = (template.layout ?? DEFAULT_INVOICE_LAYOUT) as InvoiceLayout;
  const { page, typography, colors } = layout;

  const fontFamily = FONT_FAMILY_MAP[typography.fontFamily] ?? FONT_FAMILY_MAP['helvetica'];
  const fontSize = `${typography.baseFontSize}px`;

  return (
    // A4 proportions: 210mm × 297mm → at 96dpi scale ≈ 794px × 1123px
    // We render at 595px wide (PDF points) scaled to fit the preview container
    <div
      className="bg-white shadow-lg"
      style={{
        width: '595px',
        minHeight: '842px',
        paddingTop: `${page.marginTop * 2.83}px`,
        paddingRight: `${page.marginRight * 2.83}px`,
        paddingBottom: `${page.marginBottom * 2.83}px`,
        paddingLeft: `${page.marginLeft * 2.83}px`,
        fontFamily,
        fontSize,
        color: colors.textPrimary,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header: sender info + customer info */}
      <HeaderBlock layout={layout} invoice={invoice} tenant={tenant} />

      {/* Divider */}
      <hr className="my-4" style={{ borderColor: colors.tableHeader }} />

      {/* Invoice title + meta */}
      <h1
        className="font-bold mb-3"
        style={{ fontSize: `${typography.baseFontSize + 8}px`, color: colors.primary }}
      >
        {invoice.isRectificative ? 'FACTURA RECTIFICATIVA' : 'FACTURA'}
      </h1>

      <div className="flex gap-8 mb-4">
        <div>
          <p className="text-[9px] text-neutral-500 uppercase tracking-wide mb-0.5">Número</p>
          <p className="font-semibold text-[11px]">{invoice.number}</p>
        </div>
        <div>
          <p className="text-[9px] text-neutral-500 uppercase tracking-wide mb-0.5">
            Fecha de emisión
          </p>
          <p className="font-semibold text-[11px]">{formatDate(invoice.issueDate)}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wide mb-0.5">
              Vencimiento
            </p>
            <p className="font-semibold text-[11px]">{formatDate(invoice.dueDate)}</p>
          </div>
        )}
      </div>

      {/* Lines table */}
      <ItemsTableBlock layout={layout} invoice={invoice} />

      {/* Totals */}
      <div className="mt-4">
        <TotalsBlock layout={layout} invoice={invoice} />
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-4">
          <p className="text-[9px] uppercase tracking-wide text-neutral-500 mb-1">Notas</p>
          <p className="text-[10px] text-neutral-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <FooterBlock layout={layout} invoice={invoice} tenant={tenant} />
    </div>
  );
}
