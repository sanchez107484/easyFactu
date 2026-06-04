import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { SectionLabel } from '@/components/common/section-label';
import { DataRow } from '@/components/common/data-row';
import type { Invoice, InvoiceTemplate } from '@easyfactura/shared-types';
import { formatCurrency, parseNum } from '@/lib/utils';
import { formatUnitPriceCurrency } from '@/lib/math';

interface InvoiceLinesCardProps {
  invoice: Invoice;
  template: InvoiceTemplate | null | undefined;
}

export function InvoiceLinesCard({ invoice, template }: InvoiceLinesCardProps) {
  const taxRates = [...new Set((invoice.lines ?? []).map((l) => l.taxRate))];
  const taxLabel = taxRates.length === 1 ? `IVA (${taxRates[0]}%)` : 'IVA';
  const isReagyp = invoice.compensacionPercent != null;
  const hasSurcharge = invoice.surchargeTotal != null && Number(invoice.surchargeTotal) > 0;
  const surchargeRates = [...new Set((invoice.lines ?? []).map((l) => Number(l.surchargeRate ?? 0)).filter(r => r > 0))];
  const surchargeLabel = surchargeRates.length === 1 ? `RE (${surchargeRates[0]}%)` : 'Recargo de Equivalencia';

  const showQtyColumn = (invoice.lines ?? []).some((l) => !l.hideQty);
  const showUnitPrice = template?.layout.itemsTable.showUnitPrice ?? true;
  // In REAGYP mode, the IVA column is meaningless (all lines are 0%) — hide it
  const showTaxColumn = !isReagyp && (template?.layout.itemsTable.showTaxColumn ?? true);
  const showLineTotal = template?.layout.itemsTable.showLineTotal ?? true;
  const showDiscount = (invoice.lines ?? []).some((l) => parseNum(l.discountPercent) > 0);

  return (
    <div className="rounded-xl border bg-card p-5">
      <SectionLabel icon={FileText}>Líneas de factura</SectionLabel>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
              Descripción
            </th>
            {showQtyColumn && (
              <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                Cant.
              </th>
            )}
            {showUnitPrice && (
              <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                Precio
              </th>
            )}
            {showTaxColumn && (
              <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                IVA
              </th>
            )}
            {showDiscount && (
              <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                Dto.
              </th>
            )}
            {showLineTotal && (
              <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {(invoice.lines ?? []).map((line) => (
            <tr key={line.id}>
              <td className="py-2.5 pr-4">{line.description}</td>
              {showQtyColumn && (
                <td className="py-2.5 text-right tabular-nums">
                  {line.hideQty
                    ? ''
                    : parseNum(line.quantity).toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                </td>
              )}
              {showUnitPrice && (
                <td className="py-2.5 text-right tabular-nums">
                  {formatUnitPriceCurrency(line.unitPrice)}
                </td>
              )}
              {showTaxColumn && (
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {parseNum(line.taxRate)}%
                </td>
              )}
              {showDiscount && (
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {parseNum(line.discountPercent) > 0
                    ? `${parseNum(line.discountPercent).toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`
                    : '—'}
                </td>
              )}
              {showLineTotal && (
                <td className="py-2.5 text-right tabular-nums font-medium">
                  {formatCurrency(line.lineTotal)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 pt-4 border-t ml-auto w-64 space-y-1.5">
        <DataRow label="Base imponible" value={formatCurrency(invoice.subtotal)} />
        {parseNum(invoice.discountPercent) > 0 && (
          <div className="flex justify-between items-baseline py-1">
            <span className="text-sm text-secondary-600">
              Descuento ({invoice.discountPercent}%)
            </span>
            <span className="text-sm text-secondary-600">
              −{formatCurrency(invoice.discountAmount ?? 0)}
            </span>
          </div>
        )}
        {invoice.compensacionPercent != null ? (
          Number(invoice.compensacionPercent) > 0 && (
            <div className="flex justify-between items-baseline py-1">
              <span className="text-sm">Compensación agraria ({invoice.compensacionPercent}%)</span>
              <span className="text-sm tabular-nums">
                +{formatCurrency(invoice.compensacionAmount ?? 0)}
              </span>
            </div>
          )
        ) : (
          <DataRow label={taxLabel} value={formatCurrency(invoice.taxTotal)} />
        )}
        {hasSurcharge && !isReagyp && (
          <div className="flex justify-between items-baseline py-1">
            <span className="text-sm">{surchargeLabel}</span>
            <span className="text-sm tabular-nums">
              +{formatCurrency(invoice.surchargeTotal ?? 0)}
            </span>
          </div>
        )}
        {parseNum(invoice.irpfPercent) > 0 && (
          <div className="flex justify-between items-baseline py-1">
            <span className="text-sm text-rectificativa-600">IRPF ({invoice.irpfPercent}%)</span>
            <span className="text-sm text-rectificativa-600">
              −{formatCurrency(invoice.irpfTotal ?? 0)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between items-baseline py-1">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg tabular-nums">{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>
  );
}
