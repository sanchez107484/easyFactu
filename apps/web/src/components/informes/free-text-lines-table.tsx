'use client';

import { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { FreeTextSalesLine } from '@easyfactura/shared-types';
import { REPORT_FREE_TEXT_LINE_LIMIT, VALID_TAX_RATES } from '@easyfactura/shared-constants';
import { Button } from '@/components/ui/button';
import {
  QuickCreateProductModal,
  QuickProductInitialValues,
} from '@/components/facturas/QuickCreateProductModal';
import { useCanManageCatalog } from '@/hooks/use-current-role';
import { useLinkProductAlias } from '@/hooks/use-reports';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LinkProductDialog } from './link-product-dialog';

type OpenDialog = { kind: 'link' | 'create'; line: FreeTextSalesLine } | null;

/** Product name limit of the API. */
const PRODUCT_NAME_MAX = 100;

function productValuesFrom(line: FreeTextSalesLine): QuickProductInitialValues {
  const isValidRate = VALID_TAX_RATES.some((rate) => rate === line.taxRate);
  return {
    name: line.description.slice(0, PRODUCT_NAME_MAX),
    unitPrice: line.unitPrice,
    ...(isValidRate && { taxRate: line.taxRate }),
  };
}

/** Invoice lines behind the "Sin artículo" row, shown when that row is expanded. */
export function FreeTextLinesTable({ lines }: { lines: FreeTextSalesLine[] }) {
  const canManage = useCanManageCatalog();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const linkAlias = useLinkProductAlias();
  const closeDialog = () => setDialog(null);

  if (lines.length === 0) {
    return <p className="px-10 py-3 text-sm text-muted-foreground">No hay líneas sin artículo.</p>;
  }

  return (
    <div className="space-y-2 px-10 py-3">
      <p className="text-xs text-muted-foreground">
        Líneas de factura escritas a mano que no coinciden con ningún artículo del catálogo.
        {canManage &&
          ' Conéctalas con un artículo o créalo: todas las líneas con el mismo concepto pasarán a contar para él.'}
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
              <th className="py-1.5 pr-3 font-medium">Artículo parecido</th>
              {canManage && (
                <th className="py-1.5">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <FreeTextLineRow
                key={`${line.invoiceId}:${index}`}
                line={line}
                canManage={canManage}
                onLink={() => setDialog({ kind: 'link', line })}
                onCreate={() => setDialog({ kind: 'create', line })}
              />
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

      {dialog?.kind === 'link' && <LinkProductDialog line={dialog.line} onClose={closeDialog} />}
      {dialog?.kind === 'create' && (
        <QuickCreateProductModal
          open
          onClose={closeDialog}
          initialValues={productValuesFrom(dialog.line)}
          description={`Se añadirá al catálogo y las líneas con el concepto «${dialog.line.description}» contarán para él en los informes. Las facturas no se modifican.`}
          submitLabel="Crear y conectar"
          onProductReady={(product) =>
            linkAlias.mutate({ description: dialog.line.description, productId: product.id })
          }
        />
      )}
    </div>
  );
}

interface FreeTextLineRowProps {
  line: FreeTextSalesLine;
  canManage: boolean;
  onLink: () => void;
  onCreate: () => void;
}

function FreeTextLineRow({ line, canManage, onLink, onCreate }: FreeTextLineRowProps) {
  const suggestion = line.suggestedProduct;
  return (
    <tr className="border-t border-border/60">
      <td className="whitespace-nowrap py-1.5 pr-3">{line.invoiceNumber ?? 'Sin número'}</td>
      <td className="whitespace-nowrap py-1.5 pr-3">{formatDate(line.issueDate)}</td>
      <td className="py-1.5 pr-3">{line.customerName}</td>
      <td className="py-1.5 pr-3">{line.description}</td>
      <td className="whitespace-nowrap py-1.5 pr-3 text-right tabular-nums">
        {formatCurrency(line.amount)}
      </td>
      <td className="py-1.5 pr-3 text-muted-foreground">
        {suggestion ? `${suggestion.name} (${Math.round(suggestion.similarity * 100)} %)` : '—'}
      </td>
      {canManage && (
        <td className="whitespace-nowrap py-1 text-right">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onLink}>
            <Link2 className="h-3.5 w-3.5" />
            Conectar
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5" />
            Crear artículo
          </Button>
        </td>
      )}
    </tr>
  );
}
