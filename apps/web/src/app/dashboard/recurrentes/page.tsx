'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Pause,
  Play,
  Trash2,
  MoreVertical,
  CalendarClock,
  SkipForward,
  Zap,
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useRecurringInvoices,
  useDeleteRecurringInvoice,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useSkipNextRecurringInvoice,
  useGenerateNowRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { RecurringInvoice, RecurringInvoiceStatus, RecurringFrequency } from '@easyfactura/shared-types';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.WEEKLY]: 'Semanal',
  [RecurringFrequency.BIWEEKLY]: 'Quincenal',
  [RecurringFrequency.MONTHLY]: 'Mensual',
  [RecurringFrequency.QUARTERLY]: 'Trimestral',
  [RecurringFrequency.YEARLY]: 'Anual',
};

const STATUS_CONFIG: Record<
  RecurringInvoiceStatus,
  { label: string; className: string }
> = {
  [RecurringInvoiceStatus.ACTIVE]: {
    label: 'Activa',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [RecurringInvoiceStatus.PAUSED]: {
    label: 'Pausada',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [RecurringInvoiceStatus.COMPLETED]: {
    label: 'Completada',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [RecurringInvoiceStatus.CANCELLED]: {
    label: 'Cancelada',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

// ==================== HELPERS ====================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * UX-01: For paused invoices, show "Pausada" instead of a potentially past nextRunDate.
 */
function formatNextRun(recurring: RecurringInvoice): string {
  if (recurring.status === RecurringInvoiceStatus.PAUSED) return 'Pausada';
  if (recurring.status === RecurringInvoiceStatus.COMPLETED) return 'Completada';
  if (recurring.status === RecurringInvoiceStatus.CANCELLED) return 'Cancelada';
  return formatDate(recurring.nextRunDate);
}

// ==================== DEBOUNCE HOOK ====================

/**
 * UX-04: Debounce search input to avoid firing one request per keystroke.
 */
function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ==================== ROW COMPONENT ====================

interface RecurringRowProps {
  recurring: RecurringInvoice;
  onDelete: (id: string) => void;
}

function RecurringRow({ recurring, onDelete }: RecurringRowProps) {
  const router = useRouter();
  const pause = usePauseRecurringInvoice();
  const resume = useResumeRecurringInvoice();
  const skipNext = useSkipNextRecurringInvoice();
  const generateNow = useGenerateNowRecurringInvoice();

  const statusConfig = STATUS_CONFIG[recurring.status];
  const isActive = recurring.status === RecurringInvoiceStatus.ACTIVE;
  const isPaused = recurring.status === RecurringInvoiceStatus.PAUSED;
  const isEditable = isActive || isPaused;

  // UX-05: Track per-row loading state
  const isRowPending = pause.isPending || resume.isPending || skipNext.isPending || generateNow.isPending;

  return (
    <tr
      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={() => router.push(`/dashboard/recurrentes/${recurring.id}`)}
    >
      <td className="px-4 py-3">
        <div className="font-medium text-sm">
          {recurring.description ?? recurring.customer?.name ?? '—'}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {recurring.customer?.name}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {FREQUENCY_LABELS[recurring.frequency]}
      </td>
      <td className="px-4 py-3 text-sm">
        {formatNextRun(recurring)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {recurring.generatedCount}
        {recurring.maxOccurrences != null && ` / ${recurring.maxOccurrences}`}
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('text-xs font-medium', statusConfig.className)}>
          {statusConfig.label}
        </Badge>
      </td>
      <td
        className="px-4 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* UX-05: Disable trigger during pending to prevent double-click */}
            <Button variant="ghost" size="sm" disabled={isRowPending}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/recurrentes/${recurring.id}`}>
                Ver detalle
              </Link>
            </DropdownMenuItem>
            {isEditable && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/recurrentes/${recurring.id}?edit=1`}>
                  Editar
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {isActive && (
              <>
                <DropdownMenuItem
                  onClick={() => generateNow.mutate(recurring.id)}
                  disabled={generateNow.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generar ahora
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => skipNext.mutate(recurring.id)}
                  disabled={skipNext.isPending}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Saltar siguiente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => pause.mutate(recurring.id)}
                  disabled={pause.isPending}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </DropdownMenuItem>
              </>
            )}
            {isPaused && (
              <DropdownMenuItem
                onClick={() => resume.mutate(recurring.id)}
                disabled={resume.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Reanudar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(recurring.id)}
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecurringInvoiceStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // UX-04: Debounce search
  const debouncedSearch = useDebounce(search, 350);

  const filters = {
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useRecurringInvoices(filters);
  const deleteMutation = useDeleteRecurringInvoice();

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  }, [deleteId, deleteMutation]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturas recurrentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatiza la generación periódica de facturas
          </p>
        </div>
        <Link href="/dashboard/recurrentes/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva recurrente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción o cliente…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {/* MISSING-04: Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as RecurringInvoiceStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value={RecurringInvoiceStatus.ACTIVE}>Activas</SelectItem>
            <SelectItem value={RecurringInvoiceStatus.PAUSED}>Pausadas</SelectItem>
            <SelectItem value={RecurringInvoiceStatus.COMPLETED}>Completadas</SelectItem>
            <SelectItem value={RecurringInvoiceStatus.CANCELLED}>Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive text-sm">
              Error al cargar las facturas recurrentes
            </div>
          ) : !data?.data.length ? (
            <EmptyState
              icon={CalendarClock}
              title="Sin facturas recurrentes"
              description="Configura una factura recurrente para automatizar su generación periódica."
              action={
                <Link href="/dashboard/recurrentes/nueva">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva recurrente
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción / Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Frecuencia</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Próxima generación</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Generadas</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((recurring) => (
                      <RecurringRow
                        key={recurring.id}
                        recurring={recurring}
                        onDelete={setDeleteId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MISSING-05: Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {data.meta.total} recurrentes en total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm self-center px-2">
                      {page} / {data.meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
              {data.meta.totalPages <= 1 && data.meta.total > 0 && (
                <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                  {data.meta.total} recurrente{data.meta.total !== 1 ? 's' : ''} en total
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará la configuración recurrente, pero las
              facturas ya generadas no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            {/* BUG-04 fix: disabled during isPending to prevent double-click */}
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
