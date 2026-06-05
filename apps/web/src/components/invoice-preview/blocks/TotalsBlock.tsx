import { InvoiceLayout, Invoice } from '@easyfactura/shared-types';
import { EQUIVALENCE_SURCHARGE_RATES } from '@easyfactura/shared-constants';
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
  const hasSurcharge = invoice.surchargeTotal != null && Number(invoice.surchargeTotal) > 0;
  // Resolve the effective RE rate for each line from the tax-rate-based default map (Art. 161 LIVA),
  // falling back to the stored per-line value. This guarantees the label always reflects the
  // rate that was actually applied to the totals, even if a line's taxRate was just changed.
  const surchargeRates = [
    ...new Set(
      (invoice.lines ?? [])
        .map((l) => EQUIVALENCE_SURCHARGE_RATES[Number(l.taxRate ?? 0)] ?? Number(l.surchargeRate ?? 0))
        .filter((r) => r > 0),
    ),
  ];
  const surchargeLabel =
    surchargeRates.length === 1 ? `RE (${surchargeRates[0]}%)` : 'Recargo de Equivalencia';

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

        {isReagyp
          ? // REAGYP: compensation replaces IVA (Arts. 124-134 LIVA).
            // Only show the row when there is an actual compensation rate (> 0).
            Number(invoice.compensacionPercent) > 0 && (
              <TotalsRow
                label={`Comp. agraria (${invoice.compensacionPercent}%)`}
                value={`+${formatCurrency(invoice.compensacionAmount ?? 0)}`}
              />
            )
          : showTaxBreakdown && (
              <TotalsRow label={ivaLabel} value={formatCurrency(invoice.taxTotal)} />
            )}

        {hasSurcharge && !isReagyp && (
          <TotalsRow
            label={surchargeLabel}
            value={`+${formatCurrency(invoice.surchargeTotal ?? 0)}`}
          />
        )}

        {showIrpf &&
          (isReagyp
            ? // In REAGYP: show IRPF only when a rate > 0 has been configured
              Number(invoice.irpfPercent) > 0 && (
                <TotalsRow
                  label={`IRPF (${invoice.irpfPercent}% s/base + comp.)`}
                  value={`-${formatCurrency(invoice.irpfTotal ?? 0)}`}
                />
              )
            : // In GENERAL: show IRPF whenever a rate has been configured (mirrors invoice-lines-card)
              Number(invoice.irpfPercent) > 0 && (
                <TotalsRow
                  label={`IRPF (${invoice.irpfPercent ?? 0}%)`}
                  value={`-${formatCurrency(invoice.irpfTotal ?? 0)}`}
                />
              ))}

        <div className="border-t mt-1 pt-1" style={{ borderColor: primary }}>
          <TotalsRow label="TOTAL" value={formatCurrency(invoice.total)} bold color={primary} />
        </div>
      </div>
    </div>
  );
}
