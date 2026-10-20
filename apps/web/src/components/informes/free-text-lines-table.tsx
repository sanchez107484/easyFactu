import { FreeTextSalesLine } from '@easyfactura/shared-types';
import { REPORT_FREE_TEXT_LINE_LIMIT } from '@easyfactura/shared-constants';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Invoice lines behind the "Sin artículo" row, shown when that row is expanded. */
export function FreeTextLinesTable({ lines }: { lines: FreeTextSalesLine[] }) {
  if (lines.length === 0) {
    return <p className="px-10 py-3 text-sm text-muted-foreground">No hay líneas sin artículo.</p>;
  }

  return (
    <div className="space-y-2 px-10 py-3">
      <p className="text-xs text-muted-foreground">
        Líneas de factura escritas a mano que no coinciden con ningún artículo del catálogo. Si una
        se parece a un artículo, aparece como sugerencia (no se suma a él).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="py-1.5 pr-3 font-medium">Factura</th>
              <th className="py-1.5 pr-3 font-medium">Fecha</th>
              <th className="py-1.5 pr-3 font-medium">Cliente</th>
              <th className="py-1.5 pr-3 font-medium">Concepto</th>
              <th className="py-1.5 pr-3 text-right font-medium">Importe</th>
              <th className="py-1.5 font-medium">Artículo parecido</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.invoiceId}:${index}`} className="border-t border-border/60">
                <td className="whitespace-nowrap py-1.5 pr-3">
                  {line.invoiceNumber ?? 'Sin número'}
                </td>
                <td className="whitespace-nowrap py-1.5 pr-3">{formatDate(line.issueDate)}</td>
                <td className="py-1.5 pr-3">{line.customerName}</td>
                <td className="py-1.5 pr-3">{line.description}</td>
                <td className="whitespace-nowrap py-1.5 pr-3 text-right tabular-nums">
                  {formatCurrency(line.amount)}
                </td>
                <td className="py-1.5 text-muted-foreground">
                  {line.suggestedProduct
                    ? `${line.suggestedProduct.name} (${Math.round(line.suggestedProduct.similarity * 100)} %)`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lines.length >= REPORT_FREE_TEXT_LINE_LIMIT && (
        <p className="text-xs text-muted-foreground">
          Se muestran las {REPORT_FREE_TEXT_LINE_LIMIT} más recientes. El Excel incluye la misma
          lista.
        </p>
      )}
    </div>
  );
}
