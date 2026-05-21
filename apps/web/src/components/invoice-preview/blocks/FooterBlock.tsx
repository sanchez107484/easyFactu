import { InvoiceLayout, Invoice, Tenant, InvoiceStatus } from '@easyfactura/shared-types';
import { VerifactuQrBlock } from './VerifactuQrBlock';

interface FooterBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
  tenant: Tenant;
  /** When true, passes isPreview to VerifactuQrBlock so it shows a placeholder on DRAFT invoices */
  previewMode?: boolean;
}

export function FooterBlock({ layout, invoice, tenant, previewMode = false }: FooterBlockProps) {
  const { showPaymentInfo, showVerifactuQr, text } = layout.footer;

  const hasContent = showPaymentInfo || showVerifactuQr || text;
  if (!hasContent) return null;

  return (
    <div
      className="border-t pt-2 mt-4 text-center"
      style={{ borderColor: layout.colors.tableHeader }}
    >
      {showPaymentInfo && tenant.iban && (
        <p className="text-[9px] text-neutral-500">
          Transfiere a: <span className="font-medium">{tenant.iban}</span>
          {tenant.bankAccountHolder ? ` · ${tenant.bankAccountHolder}` : ''}
        </p>
      )}

      {text && <p className="text-[9px] text-neutral-500 mt-0.5">{text}</p>}

      {showVerifactuQr && (
        <div className="flex justify-center mt-1">
          <VerifactuQrBlock
            verifactuQr={invoice.verifactuQr ?? null}
            status={invoice.status as InvoiceStatus}
            showVerifactuQr={showVerifactuQr}
            mode="footer"
            isPreview={previewMode}
          />
        </div>
      )}
    </div>
  );
}
