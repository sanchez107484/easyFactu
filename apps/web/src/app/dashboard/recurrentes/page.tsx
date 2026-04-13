'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  RefreshCcw,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useRecurringInvoices,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useDeleteRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { RecurringInvoice, RecurringFrequency, RecurringStatus } from '@easyfactura/shared-types';

// ==================== CONSTANTS ====================

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.MONTHLY]: 'Mensual',
  [RecurringFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringFrequency.QUARTERLY]: 'Trimestral',
  [RecurringFrequency.SEMIANNUAL]: 'Semestral',
  [RecurringFrequency.ANNUAL]: 'Anual',
};

const STATUS_CONFIG: Record<
  RecurringStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [RecurringStatus.ACTIVE]: { label: 'Activa', variant: 'default' },
  [RecurringStatus.PAUSED]: { label: 'Pausada', variant: 'secondary' },
  [RecurringStatus.COMPLETED]: { label: 'Completada', variant: 'outline' },
  [RecurringStatus.CANCELLED]: { label: 'Cancelada', variant: 'destructive' },
};

// ==================== HELPERS ====================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ==================== COMPONENTS ====================

function RecurringInvoiceRow({
  recurring,
  pendingPauseId,
  pendingResumeId,
  onPause,
  onResume,
  onDelete,
}: {
  recurring: RecurringInvoice;
  pendingPauseId: string | null;
  pendingResumeId: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (recurring: RecurringInvoice) => void;
}) {
  const isPausingThis = pendingPauseId === recurring.id;
  const isResumingThis = pendingResumeId === recurring.id;
  const isAnyPending = isPausingThis || isResumingThis;
  const statusConfig = STATUS_CONFIG[recurring.status];

  // UX-01: For paused invoices, don't show a stale nextRunDate — show "Pausada"
  const showNextRunDate =
    recurring.status === RecurringStatus.ACTIVE && recurring.nextRunDate;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/recurrentes/${recurring.id}`}
          className="font-medium hover:underline text-sm"
        >
          {recurring.name}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {recurring.customer?.name}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {FREQUENCY_LABELS[recurring.frequency]}
      </td>
      <td className="px-4 py-3 text-sm">
        {showNextRunDate ? (
          formatDate(recurring.nextRunDate!)
        ) : recurring.status === RecurringStatus.PAUSED ? (
          <span className="text-muted-foreground italic text-xs">Pausada</span>
        ) : recurring.status === RecurringStatus.COMPLETED ? (
          <span className="text-muted-foreground italic text-xs">Completada</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {recurring.occurrencesCount}
        {recurring.maxOccurrences ? ` / ${recurring.maxOccurrences}` : ''}
      </td>
      <td className="px-4 py-3 text-right">
        {/* UX-05: Per-row loading state for Pause/Resume */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isAnyPending}>
              {isAnyPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/recurrentes/${recurring.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </Link>
            </DropdownMenuItem>

            {recurring.status === RecurringStatus.ACTIVE && (
              <DropdownMenuItem
                onClick={() => onPause(recurring.id)}
                disabled={isAnyPending}
              >
                {isPausingThis ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                Pausar
              </DropdownMenuItem>
            )}

            {recurring.status === RecurringStatus.PAUSED && (
              <DropdownMenuItem
                onClick={() => onResume(recurring.id)}
                disabled={isAnyPending}
              >
                {isResumingThis ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Reanudar
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDelete(recurring)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ==================== PAGE ====================

export default function RecurrentesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecurringStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<RecurringInvoice | null>(null);

  // UX-04: Debounce search input — wait 400ms before triggering query
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Reset page when filters change
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as RecurringStatus | '');
    setPage(1);
  }, []);

  const { data, isLoading, error } = useRecurringInvoices({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const pauseMutation = usePauseRecurringInvoice();
  const resumeMutation = useResumeRecurringInvoice();
  const deleteMutation = useDeleteRecurringInvoice();

  // Track which row is pending (UX-05)
  const pendingPauseId = pauseMutation.isPending ? (pauseMutation.variables as string) : null;
  const pendingResumeId = resumeMutation.isPending ? (resumeMutation.variables as string) : null;

  const handlePause = useCallback(
    (id: string) => {
      pauseMutation.mutate(id);
    },
    [pauseMutation],
  );

  const handleResume = useCallback(
    (id: string) => {
      resumeMutation.mutate(id);
    },
    [resumeMutation],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMutation]);

  const totalPages = data?.meta.totalPages ?? 1;
  const total = data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturas recurrentes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automatiza la emisión de facturas periódicas
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recurrentes/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva recurrente
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o cliente..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* MISSING-04: Filter by status */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value={RecurringStatus.ACTIVE}>Activas</SelectItem>
            <SelectItem value={RecurringStatus.PAUSED}>Pausadas</SelectItem>
            <SelectItem value={RecurringStatus.COMPLETED}>Completadas</SelectItem>
            <SelectItem value={RecurringStatus.CANCELLED}>Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Error al cargar las facturas recurrentes
            </div>
          ) : !data?.data.length ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <RefreshCcw className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {debouncedSearch || statusFilter
                  ? 'Sin resultados'
                  : 'No hay facturas recurrentes'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {debouncedSearch || statusFilter
                  ? 'No se encontraron resultados con los filtros aplicados.'
                  : 'Crea tu primera factura recurrente para automatizar la facturación periódica.'}
              </p>
              {!debouncedSearch && !statusFilter && (
                <Button asChild>
                  <Link href="/dashboard/recurrentes/nueva">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva recurrente
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Nombre / Cliente
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Frecuencia
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Próxima generación
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Generadas
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((recurring) => (
                      <RecurringInvoiceRow
                        key={recurring.id}
                        recurring={recurring}
                        pendingPauseId={pendingPauseId}
                        pendingResumeId={pendingResumeId}
                        onPause={handlePause}
                        onResume={handleResume}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MISSING-05: Pagination with total indicator */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {total} factura{total !== 1 ? 's' : ''} recurrente
                    {total !== 1 ? 's' : ''}
                    {total > data.data.length && (
                      <span> · Mostrando {data.data.length} de {total}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Show total count when only one page */}
              {totalPages <= 1 && total > 0 && (
                <div className="px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {total} factura{total !== 1 ? 's' : ''} recurrente
                    {total !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog — BUG-04: button disabled during isPending */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente "{deleteTarget?.name}" y no se generarán
              más facturas. Las facturas ya generadas no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            {/* BUG-04: Disabled during isPending to prevent double-click */}
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
