'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useImpersonationLogs, useAgencyClients } from '@/hooks/use-agency';

import type { AgencyImpersonationLogQuery } from '@easyfactura/shared-types';

const ALL_VALUE = '__all__';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return 'Sesión activa';
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function AgencyAuditoriaPage() {
  const [clientTenantId, setClientTenantId] = useState<string>(ALL_VALUE);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [clientTenantId, dateFrom, dateTo]);

  const query = useMemo<AgencyImpersonationLogQuery>(() => {
    const q: AgencyImpersonationLogQuery = { page, limit };
    if (clientTenantId !== ALL_VALUE) q.clientTenantId = clientTenantId;
    if (dateFrom) q.dateFrom = dateFrom;
    if (dateTo) q.dateTo = dateTo;
    return q;
  }, [clientTenantId, dateFrom, dateTo, page, limit]);

  const { data, isLoading, isFetching, error, refetch } = useImpersonationLogs(query);

  // Client list for filter
  const { data: clientsData } = useAgencyClients({ page: 1, limit: 500 });
  const clientOptions = clientsData?.data ?? [];
  const [clientComboOpen, setClientComboOpen] = useState(false);

  const selectedClientOption =
    clientTenantId === ALL_VALUE
      ? null
      : (clientOptions.find((c) => c.clientTenantId === clientTenantId) ?? null);

  const hasActiveFilters =
    clientTenantId !== ALL_VALUE || dateFrom !== '' || dateTo !== '';

  const resetFilters = () => {
    setClientTenantId(ALL_VALUE);
    setDateFrom('');
    setDateTo('');
  };

  const totalPages = data?.meta.totalPages ?? 1;
  const total = data?.meta.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Auditoría de accesos</h1>
            <p className="text-sm text-muted-foreground">
              Registro de todas las veces que un usuario de la asesoría ha accedido como un cliente.
              Estos registros son inmutables y se conservan con fines de cumplimiento.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientComboOpen}
                  className="w-full h-10 px-3 text-sm font-normal justify-between"
                >
                  <span className="truncate">
                    {selectedClientOption
                      ? (selectedClientOption.clientTenant?.businessName ??
                        selectedClientOption.clientTenantId)
                      : 'Todos los clientes'}
                  </span>
                  <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command
                  filter={(value, search) =>
                    value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                  }
                >
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos-los-clientes"
                        onSelect={() => {
                          setClientTenantId(ALL_VALUE);
                          setClientComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            clientTenantId === ALL_VALUE ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        Todos los clientes
                      </CommandItem>
                      {clientOptions.map((c) => (
                        <CommandItem
                          key={c.clientTenantId}
                          value={c.clientTenant?.businessName ?? c.clientTenantId}
                          onSelect={() => {
                            setClientTenantId(c.clientTenantId);
                            setClientComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              clientTenantId === c.clientTenantId ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {c.clientTenant?.businessName ?? c.clientTenantId}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fecha Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fecha Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Mostrando {data?.data.length ?? 0} de {total} registros filtrados
            </p>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-sm text-destructive">
              No se ha podido cargar el registro de auditoría.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium">Sin registros</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No hay accesos que coincidan con los filtros aplicados.'
                : 'Todavía no se ha registrado ningún acceso a clientes.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Inicio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-[120px] text-right">Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {formatDateTime(row.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{row.clientBusinessName}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatDuration(row.startedAt, row.endedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
