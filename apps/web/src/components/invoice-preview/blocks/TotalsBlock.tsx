import { InvoiceLayout, Invoice } from '@easyfactura/shared-types';
import { formatCurrency } from '@/lib/utils';

interface TotalsBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
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
        className={`text-[10px] ${bold ? 'font-semibold' : 'text-neutral-500'}`}
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
  const { showTaxBreakdown, showIrpf = true } = layout.totals;
  const { primary } = layout.colors;

  const taxRates = [...new Set((invoice.lines ?? []).map((l) => l.taxRate))];
  const ivaLabel = taxRates.length === 1 ? `IVA (${taxRates[0]}%)` : 'IVA';
  const isReagyp = invoice.compensacionPercent != null;

  return (
    <div className="flex justify-end">
      <div className="w-52">
        <TotalsRow label="Base imponible total" value={formatCurrency(invoice.subtotal)} />

        {(invoice.discountAmount ?? 0) > 0 && (
          <TotalsRow
            label={`Descuento (${invoice.discountPercent ?? 0}%)`}
            value={`-${formatCurrency(invoice.discountAmount ?? 0)}`}
          />
        )}

        {isReagyp ? (
          <TotalsRow
            label={`Comp. agraria (${invoice.compensacionPercent}%)`}
            value={`+${formatCurrency(invoice.compensacionAmount ?? 0)}`}
          />
        ) : (
          showTaxBreakdown && (
            <TotalsRow label={ivaLabel} value={formatCurrency(invoice.taxTotal)} />
          )
        )}

        {showIrpf && (invoice.irpfTotal ?? 0) > 0 && (
          <TotalsRow
            label={`IRPF (${invoice.irpfPercent ?? 0}%)`}
            value={`-${formatCurrency(invoice.irpfTotal ?? 0)}`}
          />
        )}

        <div className="border-t mt-1 pt-1" style={{ borderColor: primary }}>
          <TotalsRow label="TOTAL" value={formatCurrency(invoice.total)} bold color={primary} />
        </div>
      </div>
    </div>
  );
}
