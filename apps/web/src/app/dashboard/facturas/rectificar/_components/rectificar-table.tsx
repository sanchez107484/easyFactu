'use client';

import { SortableHeader } from '@/components/common/sortable-header';
import type { SelectableInvoiceForRectification } from '@easyfactura/shared-types';
import { RectificarMobileCard } from './rectificar-mobile-card';
import { RectificarDesktopRow } from './rectificar-desktop-row';
import { RectificarTableSkeleton, RectificarTableEmpty } from './rectificar-table-states';
import { RectificarPagination } from './rectificar-pagination';

type SortDir = 'asc' | 'desc';

interface RectificarTableProps {
  invoices: SelectableInvoiceForRectification[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const RECTIFICAR_PAGE_LIMIT = 10;

/**
 * Vista de tabla + tarjeta móvil para la pantalla de selección.
 * Cada fila abre el modal de rectificación al hacer click.
 */
export function RectificarTable({
  invoices,
  isLoading,
  total,
  page,
  totalPages,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  onPageChange,
}: RectificarTableProps) {
  if (isLoading) return <RectificarTableSkeleton rows={RECTIFICAR_PAGE_LIMIT} />;
  if (invoices.length === 0) return <RectificarTableEmpty />;

  return (
    <>
      <div className="divide-y sm:hidden">
        {invoices.map((inv) => (
          <RectificarMobileCard key={inv.id} invoice={inv} onSelect={onSelect} />
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/40">
            <tr>
              <SortableHeader
                label="Número"
                sortKey="number"
                currentKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                className="px-6"
              />
              <SortableHeader
                label="Cliente"
                sortKey="customer"
                currentKey={sortKey}
                direction={sortDir}
                onSort={onSort}
              />
              <SortableHeader
                label="Emisión"
                sortKey="issueDate"
                currentKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="Total"
                sortKey="total"
                currentKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                align="right"
              />
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Rectificativas
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv) => (
              <RectificarDesktopRow key={inv.id} invoice={inv} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>

      <RectificarPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onChange={onPageChange}
      />
    </>
  );
}
