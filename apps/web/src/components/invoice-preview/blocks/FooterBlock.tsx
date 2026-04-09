import { InvoiceLayout, Invoice, Tenant } from '@easyfactura/shared-types';

interface FooterBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
  tenant: Tenant;
}

export function FooterBlock({ layout, invoice, tenant }: FooterBlockProps) {
  const { showPaymentInfo, showVerifactuQr, text } = layout.footer;

  const hasContent = showPaymentInfo || showVerifactuQr || text;
  if (!hasContent) return null;

  return (
    <div
      className="border-t pt-2 mt-4 text-center"
      style={{ borderColor: layout.colors.tableHeader }}
    >
      {showPaymentInfo && tenant.iban && (
        <p className="text-[9px] text-gray-500">
          Transfiere a: <span className="font-medium">{tenant.iban}</span>
          {tenant.bankAccountHolder ? ` · ${tenant.bankAccountHolder}` : ''}
        </p>
      )}

      {text && <p className="text-[9px] text-gray-500 mt-0.5">{text}</p>}

      {/* {showVerifactuQr && invoice.verifactuQr && (
        <p className="text-[9px] text-gray-400 mt-1">
          Verificación VeriFactu: {invoice.verifactuQr}
        </p>
      )}

      {showVerifactuQr && !invoice.verifactuQr && (
        <div className="flex justify-center mt-1">
          <div className="w-10 h-10 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-400 text-center leading-tight">
              QR
              <br />
              VeriFactu
            </span>
          </div>
        </div>
      )} */}
    </div>
  );
}
