'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, RefreshCw, Pause, Play, Trash2, MoreVertical, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  useRecurringInvoices,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useDeleteRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import {
  RecurringFrequencyBadge,
  RecurringStatusBadge,
} from '@/components/recurrentes/recurring-badges';
import { EmptyState } from '@/components/common/empty-state';
import { RecurringInvoice, RecurringStatus } from '@easyfactura/shared-types';
import { formatDate } from '@/lib/utils';

// ==================== HELPERS ====================

function calculateMonthlyAmount(lines: RecurringInvoice['lines']): number {
  if (!lines) return 0;
  return lines.reduce((sum, line) => {
    const subtotal = Number(line.quantity) * Number(line.unitPrice);
    const tax = subtotal * (Number(line.taxRate) / 100);
    return sum + subtotal + tax;
  }, 0);
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// ==================== SKELETON ====================

function RecurringTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border rounded-lg">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

// ==================== PAGE ====================

export default function RecurrentesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useRecurringInvoices({
    limit: 50,
    search: search || undefined,
  });
  const pauseMutation = usePauseRecurringInvoice();
  const resumeMutation = useResumeRecurringInvoice();
  const deleteMutation = useDeleteRecurringInvoice();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader search={search} onSearchChange={setSearch} />
        <RecurringTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader search={search} onSearchChange={setSearch} />
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar las facturas recurrentes. Inténtalo de nuevo.
        </div>
      </div>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader search={search} onSearchChange={setSearch} />

      {items.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title={search ? 'Sin resultados' : 'Sin facturas recurrentes'}
          description={
            search
              ? `No hay recurrentes que coincidan con "${search}".`
              : 'Automatiza tus facturas mensuales. Configura una vez y se generarán solas.'
          }
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </Button>
            ) : (
              <Link href="/dashboard/recurrentes/nueva">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva recurrente
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <RecurringTable
              items={items}
              onPause={(id) => pauseMutation.mutate(id)}
              onResume={(id) => resumeMutation.mutate(id)}
              onDelete={(id) => setDeleteId(id)}
              onEdit={(id) => router.push(`/dashboard/recurrentes/nueva?edit=${id}`)}
            />
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la configuración de recurrencia. Las facturas ya generadas no se verán
              afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function PageHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facturas recurrentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Se generan automáticamente cada período sin que tengas que hacer nada.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 w-52"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Link href="/dashboard/recurrentes/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva recurrente
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface RecurringTableProps {
  items: RecurringInvoice[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function RecurringTable({ items, onPause, onResume, onDelete, onEdit }: RecurringTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              Importe aprox.
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Frecuencia</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Próxima generación
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              onPause={onPause}
              onResume={onResume}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RecurringRowProps {
  item: RecurringInvoice;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function RecurringRow({ item, onPause, onResume, onDelete, onEdit }: RecurringRowProps) {
  const amount = calculateMonthlyAmount(item.lines);
  const isActive = item.status === RecurringStatus.ACTIVE;
  const isPaused = item.status === RecurringStatus.PAUSED;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/recurrentes/${item.id}`}
          className="font-medium hover:underline underline-offset-4"
        >
          {item.customer?.name ?? '—'}
        </Link>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{item.notes}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(amount)}</td>
      <td className="px-4 py-3">
        <RecurringFrequencyBadge frequency={item.frequency} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.status === RecurringStatus.COMPLETED ? '—' : formatDate(item.nextRunDate)}
        {item.autoConfirm && (
          <span className="ml-2 text-xs text-muted-foreground">(auto-confirmada)</span>
        )}
      </td>
      <td className="px-4 py-3">
        <RecurringStatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/recurrentes/${item.id}`}>Ver detalle</Link>
            </DropdownMenuItem>
            {item.status !== RecurringStatus.COMPLETED && (
              <DropdownMenuItem onClick={() => onEdit(item.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {isActive && (
              <DropdownMenuItem onClick={() => onPause(item.id)}>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </DropdownMenuItem>
            )}
            {isPaused && (
              <DropdownMenuItem onClick={() => onResume(item.id)}>
                <Play className="mr-2 h-4 w-4" />
                Reactivar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
