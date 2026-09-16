'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useSortTable } from '@/hooks/use-sort-table';
import {
  useSelectableInvoicesForRectification,
  useInvoice,
  usePrefetchInvoice,
} from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { Card, CardContent } from '@/components/ui/card';
import { RectificationType } from '@easyfactura/shared-types';
import { RectifyInvoiceDialog } from '@/components/facturas/RectifyInvoiceDialog';
import {
  RectificarHeader,
  resolveRectificationType,
} from './_components/rectificar-header';
import {
  RectificarFilters,
  type RectificarFiltersState,
} from './_components/rectificar-filters';
import { RectificarTable, RECTIFICAR_PAGE_LIMIT } from './_components/rectificar-table';

export default function SeleccionarRectificativaPage() {
  const searchParams = useSearchParams();
  const defaultType = resolveRectificationType(searchParams.get('tipo'));
  const isAbono = defaultType === RectificationType.DIFFERENCES;

  const [filters, setFilters] = useState<RectificarFiltersState>({
    search: '',
    fromDate: '',
    toDate: '',
    customerId: '',
  });
  const debouncedSearch = useDebounce(filters.search, 300);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');
  const { data: customersData } = useCustomers({ limit: 500 });
  const customers = customersData?.data ?? [];
  const prefetchInvoice = usePrefetchInvoice();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.customerId, filters.fromDate, filters.toDate, sortKey, sortDir]);

  const { data, isLoading } = useSelectableInvoicesForRectification({
    search: debouncedSearch || undefined,
    customerId: filters.customerId || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    page,
    limit: RECTIFICAR_PAGE_LIMIT,
    sortBy: sortKey as
      | 'number'
      | 'issueDate'
      | 'dueDate'
      | 'total'
      | 'createdAt'
      | 'customer',
    sortOrder: sortDir,
    excludeAlreadyRectified: true,
  });

  const invoices = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const { data: fullInvoice } = useInvoice(selectedId ?? '', {
    enabled: Boolean(selectedId),
  });

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setSelectedId(null);
  };

  return (
    <div className="space-y-5 pb-6">
      <RectificarHeader isAbono={isAbono} />

      <RectificarFilters state={filters} onChange={setFilters} customers={customers} />

      <Card>
        <CardContent className="p-0">
          <RectificarTable
            invoices={invoices}
            isLoading={isLoading}
            total={total}
            page={page}
            totalPages={totalPages}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onSelect={setSelectedId}
            onPageChange={setPage}
          />
        </CardContent>
        <PrefetchTrigger invoices={invoices} prefetch={prefetchInvoice} />
      </Card>

      {selectedId && fullInvoice && (
        <RectifyInvoiceDialog
          open={Boolean(selectedId)}
          onOpenChange={handleDialogOpenChange}
          defaultType={defaultType}
          invoice={fullInvoice}
        />
      )}
    </div>
  );
}

interface PrefetchTriggerProps {
  invoices: { id: string }[];
  prefetch: (id: string) => void;
}

/**
 * Pre-warm del caché de detalle al hover de cada fila.
 * Usa un canal visual oculto + onMouseEnter por fila.
 */
function PrefetchTrigger({ invoices, prefetch }: PrefetchTriggerProps) {
  return (
    <div className="sr-only" aria-hidden>
      {invoices.map((inv) => (
        <button
          key={inv.id}
          type="button"
          tabIndex={-1}
          onMouseEnter={() => prefetch(inv.id)}
        />
      ))}
    </div>
  );
}
