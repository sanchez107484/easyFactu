import { InvoiceLayout, Invoice } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

interface ItemsTableBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

export function ItemsTableBlock({ layout, invoice }: ItemsTableBlockProps) {
  const lines = invoice.lines ?? [];
  const { style, showDiscount, showReference } = layout.itemsTable;
  const { tableHeader, primary } = layout.colors;

  const isGrid = style === 'grid';
  const isLines = style === 'lines';

  const thClass = cn(
    'text-[9px] font-semibold text-left py-1 px-2',
    isGrid && 'border border-gray-200',
  );

  const tdClass = cn(
    'text-[10px] py-1.5 px-2',
    isLines && 'border-b',
    isGrid && 'border border-gray-200',
  );

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr style={{ backgroundColor: tableHeader }}>
          {showReference && <th className={cn(thClass, 'w-16')}>Ref.</th>}
          <th className={thClass}>Descripción</th>
          <th className={cn(thClass, 'text-right w-12')}>Cant.</th>
          <th className={cn(thClass, 'text-right w-20')}>Precio unit.</th>
          <th className={cn(thClass, 'text-right w-12')}>IVA</th>
          {showDiscount && <th className={cn(thClass, 'text-right w-12')}>Dto.</th>}
          <th className={cn(thClass, 'text-right w-20')}>Total</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="hover:bg-gray-50/50">
            {showReference && <td className={tdClass}>{line.productId ?? '—'}</td>}
            <td className={tdClass}>{line.description}</td>
            <td className={cn(tdClass, 'text-right')}>{line.quantity}</td>
            <td className={cn(tdClass, 'text-right')}>{formatCurrency(line.unitPrice)}</td>
            <td className={cn(tdClass, 'text-right')}>{line.taxRate}%</td>
            {showDiscount && <td className={cn(tdClass, 'text-right')}>—</td>}
            <td className={cn(tdClass, 'text-right font-medium')} style={{ color: primary }}>
              {formatCurrency(line.lineTotal)}
            </td>
          </tr>
        ))}
        {lines.length === 0 && (
          <tr>
            <td
              colSpan={4 + (showReference ? 1 : 0) + (showDiscount ? 1 : 0) + 1}
              className="text-center text-gray-400 py-4 text-[10px]"
            >
              Sin líneas
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
