import { InvoiceLayout, Invoice } from '@easyfactura/shared-types';

interface TotalsBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

interface TotalsRowProps {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}

function TotalsRow({ label, value, bold, color }: TotalsRowProps) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span
        className={`text-[10px] ${bold ? 'font-semibold' : 'text-gray-500'}`}
        style={color ? { color } : undefined}
      >
        {label}
      </span>
      <span
        className={`text-[10px] ${bold ? 'font-semibold' : ''}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function TotalsBlock({ layout, invoice }: TotalsBlockProps) {
  const { showTaxBreakdown, showIrpf } = layout.totals;
  const { primary } = layout.colors;

  return (
    <div className="flex justify-end">
      <div className="w-52">
        <TotalsRow label="Base imponible" value={formatCurrency(invoice.subtotal)} />

        {invoice.discountAmount && invoice.discountAmount > 0 && (
          <TotalsRow
            label={`Descuento (${invoice.discountPercent ?? 0}%)`}
            value={`-${formatCurrency(invoice.discountAmount)}`}
          />
        )}

        {showTaxBreakdown && <TotalsRow label="IVA" value={formatCurrency(invoice.taxTotal)} />}

        {showIrpf && invoice.irpfTotal && invoice.irpfTotal > 0 && (
          <TotalsRow
            label={`IRPF (${invoice.irpfPercent ?? 0}%)`}
            value={`-${formatCurrency(invoice.irpfTotal)}`}
          />
        )}

        <div className="border-t mt-1 pt-1" style={{ borderColor: primary }}>
          <TotalsRow label="TOTAL" value={formatCurrency(invoice.total)} bold color={primary} />
        </div>
      </div>
    </div>
  );
}
