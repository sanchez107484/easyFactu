'use client';
import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useSortTable } from '@/hooks/use-sort-table';
import { useInvoices, useInvoice, usePrefetchInvoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { InvoiceStatus, RectificationType } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  ArrowLeft,
  RotateCcw,
  Receipt,
  SlidersHorizontal,
  X,
  Check,
  ChevronsUpDown,
  Users,
} from 'lucide-react';
import { formatCurrency, formatDateShort, cn } from '@/lib/utils';
import { SortableHeader } from '@/components/common/sortable-header';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { RectifyInvoiceDialog } from '@/components/facturas/RectifyInvoiceDialog';

const RECTIFICABLE_STATUS = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
] as any;

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20 hidden sm:block" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function SeleccionarRectificativaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo');
  const defaultType =
    tipoParam === 'abono' ? RectificationType.DIFFERENCES : RectificationType.SUBSTITUTION;
  const isAbono = defaultType === RectificationType.DIFFERENCES;

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');
  const { data: customersData } = useCustomers({ limit: 500 });
  const customers = customersData?.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const prefetchInvoice = usePrefetchInvoice();

  // Factura completa para el modal (con líneas)
  const { data: fullInvoice } = useInvoice(selectedId ?? '', { enabled: !!selectedId } as any);

  useEffect(() => {
    setPage(1);
  }, [search, fromDate, toDate, customerId, sortKey, sortDir]);

  const { data, isLoading } = useInvoices({
    search: search || undefined,
    status: RECTIFICABLE_STATUS,
    customerId: customerId || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit: 10,
    sortBy: sortKey as any,
    sortOrder: sortDir,
  } as any);

  const invoices = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const advancedCount = (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (customerId ? 1 : 0);

  return (
    <div className="space-y-5 pb-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {isAbono ? <Receipt className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
            {isAbono ? 'Crear Abono / Devolución' : 'Crear Rectificativa'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecciona una factura confirmada para rectificar. Solo se muestran facturas con estado
            Confirmada, Enviada o Cobrada.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => router.replace('/dashboard/facturas/rectificar?tipo=sustitucion')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              !isAbono ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Sustitución
          </button>
          <button
            onClick={() => router.replace('/dashboard/facturas/rectificar?tipo=abono')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              isAbono ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Abono
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, cliente o NIF..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showAdvanced || advancedCount > 0 ? 'secondary' : 'outline'}
          onClick={() => setShowAdvanced((v) => !v)}
          className="shrink-0 gap-1.5"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros{' '}
          {advancedCount > 0 && <Badge className="h-5 min-w-5 px-1 text-xs">{advancedCount}</Badge>}
        </Button>
      </div>

      {showAdvanced && (
        <div className="rounded-lg border bg-muted/30 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1.5 flex gap-1">
              <Users className="h-3 w-3" />
              Cliente
            </Label>
            <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-8 text-sm font-normal"
                >
                  <span className="truncate">
                    {selectedCustomer ? selectedCustomer.name : 'Todos'}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>No encontrado</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos"
                        onSelect={() => {
                          setCustomerId('');
                          setCustomerComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', !customerId ? 'opacity-100' : 'opacity-0')}
                        />
                        Todos
                      </CommandItem>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.nif}`}
                          onSelect={() => {
                            setCustomerId(c.id);
                            setCustomerComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              customerId === c.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : invoices.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm font-medium">Sin facturas rectificables</p>
              <p className="text-xs text-muted-foreground mt-1">
                No hay facturas confirmadas con ese filtro
              </p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="divide-y sm:hidden">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 flex justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold">{inv.number}</p>
                      <p className="text-sm truncate max-w-[160px]">{inv.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(inv.issueDate)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-semibold">{formatCurrency(Number(inv.total))}</p>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedId(inv.id)}
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop - Tabla compacta */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <SortableHeader
                        label="Número"
                        sortKey="number"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="px-5"
                      />
                      <SortableHeader
                        label="Cliente"
                        sortKey="customer"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Fecha"
                        sortKey="issueDate"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Total"
                        sortKey="total"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                      />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-3 w-[120px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onMouseEnter={() => prefetchInvoice(inv.id)}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-sm font-medium">{inv.number}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {inv.customer?.name}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {inv.customer?.nif}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateShort(inv.issueDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          {formatCurrency(Number(inv.total))}
                        </td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedId(inv.id)}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Página {page} de {totalPages} · {total} facturas
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedId && fullInvoice && (
        <RectifyInvoiceDialog
          open={!!selectedId}
          onOpenChange={(o) => !o && setSelectedId(null)}
          defaultType={defaultType}
          invoice={{
            id: fullInvoice.id,
            number: fullInvoice.number,
            customerName: fullInvoice.customer?.name ?? '—',
            lines: fullInvoice.lines ?? [],
          }}
        />
      )}
    </div>
  );
}
