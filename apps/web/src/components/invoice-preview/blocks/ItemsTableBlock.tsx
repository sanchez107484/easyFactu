import { InvoiceLayout, Invoice } from '@easyfactura/shared-types';
import { cn, formatCurrency } from '@/lib/utils';
import { formatUnitPriceCurrency } from '@/lib/math';

interface ItemsTableBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
}

// Tipo local para las líneas de vista previa, que incluyen _hideQty/_hideQty como campo extra
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviewLine = Record<string, any>;

/** Resolves whether to hide qty for a line: uses stored `hideQty` if present, otherwise `_hideQty` */
function resolveHideQty(line: PreviewLine): boolean {
  if (typeof line.hideQty === 'boolean') return line.hideQty;
  return !!line._hideQty;
}

export function ItemsTableBlock({ layout, invoice }: ItemsTableBlockProps) {
  const lines = invoice.lines ?? [];
  const { style, showReference } = layout.itemsTable;
  const showUnitPrice = layout.itemsTable.showUnitPrice ?? true;
  // In REAGYP mode all lines have taxRate=0 and IVA doesn't apply — hide the column
  const isReagyp = invoice.compensacionPercent != null;
  const showTaxColumn = !isReagyp && (layout.itemsTable.showTaxColumn ?? true);
  const showLineTotal = layout.itemsTable.showLineTotal ?? true;
  // Respect the user's toggle, but never hide real discounts that exist in the data,
  // UNLESS the layout explicitly forces showDiscount=false (e.g. simplifyTable).
  const hasDiscountData = lines.some((l) => (l.discountPercent ?? 0) > 0);
  // Show the Dto column only when actual discount data exists.
  // layout.itemsTable.showDiscount===false is the hard override (simplifyTable).
  const showDiscount = layout.itemsTable.showDiscount === false ? false : hasDiscountData;
  const { tableHeader, primary } = layout.colors;

  const isGrid = style === 'grid';
  const isLines = style === 'lines';

  // Mostrar columna Cant. solo si al menos una línea tiene cantidad visible
  const showQtyCol = lines.some((l) => !resolveHideQty(l as PreviewLine));

  const thClass = cn(
    'text-[9px] font-semibold text-left py-1 px-2',
    isGrid && 'border border-neutral-200',
  );

  const tdClass = cn(
    'text-[10px] py-1.5 px-2',
    isLines && 'border-b',
    isGrid && 'border border-neutral-200',
  );

  const colSpanBase =
    1 + // descripción
    (showReference ? 1 : 0) +
    (showQtyCol ? 1 : 0) +
    (showUnitPrice ? 1 : 0) +
    (showTaxColumn ? 1 : 0) +
    (showDiscount ? 1 : 0) +
    (showLineTotal ? 1 : 0);

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr style={{ backgroundColor: tableHeader }}>
          {showReference && <th className={cn(thClass, 'w-16')}>Ref.</th>}
          <th className={thClass}>Descripción</th>
          {showQtyCol && <th className={cn(thClass, 'text-right w-12')}>Cant.</th>}
          {showUnitPrice && <th className={cn(thClass, 'text-right w-20')}>Precio unit.</th>}
          {showTaxColumn && <th className={cn(thClass, 'text-right w-12')}>IVA</th>}
          {showDiscount && <th className={cn(thClass, 'text-right w-12')}>Dto.</th>}
          {showLineTotal && <th className={cn(thClass, 'text-right w-20')}>Total</th>}
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const hideQty = resolveHideQty(line as PreviewLine);
          return (
            <tr key={line.id} className="hover:bg-neutral-50/50">
              {showReference && <td className={tdClass}>{line.productId ?? '—'}</td>}
              <td className={cn(tdClass, 'whitespace-pre-wrap')}>{line.description}</td>
              {showQtyCol && (
                <td className={cn(tdClass, 'text-right')}>
                  {hideQty
                    ? ''
                    : Number(line.quantity).toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                </td>
              )}
              {showUnitPrice && (
                <td className={cn(tdClass, 'text-right')}>
                  {formatUnitPriceCurrency(line.unitPrice)}
                </td>
              )}
              {showTaxColumn && <td className={cn(tdClass, 'text-right')}>{line.taxRate}%</td>}
              {showDiscount && (
                <td className={cn(tdClass, 'text-right')}>
                  {(line.discountPercent ?? 0) > 0
                    ? `${Number(line.discountPercent).toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`
                    : '—'}
                </td>
              )}
              {showLineTotal && (
                <td className={cn(tdClass, 'text-right font-medium')} style={{ color: primary }}>
                  {formatCurrency(line.lineTotal)}
                </td>
              )}
            </tr>
          );
        })}
        {lines.length === 0 && (
          <tr>
            <td colSpan={colSpanBase} className="text-center text-neutral-400 py-4 text-[10px]">
              Sin líneas
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
