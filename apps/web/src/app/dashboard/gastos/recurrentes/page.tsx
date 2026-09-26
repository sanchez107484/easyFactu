'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Repeat,
  Calendar,
  ChevronRight,
  Receipt,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { RecurringExpense, RecurringExpenseFrequency } from '@easyfactura/shared-types';
import {
  useRecurringExpenses,
  useDeleteRecurringExpense,
  useGenerateRecurringExpenses,
  usePrefetchRecurringExpense,
} from '@/hooks/use-recurring-expenses';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<RecurringExpenseFrequency, string> = {
  [RecurringExpenseFrequency.WEEKLY]: 'Semanal',
  [RecurringExpenseFrequency.MONTHLY]: 'Mensual',
  [RecurringExpenseFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringExpenseFrequency.QUARTERLY]: 'Trimestral',
  [RecurringExpenseFrequency.YEARLY]: 'Anual',
};

const FREQUENCY_COLORS: Record<RecurringExpenseFrequency, string> = {
  [RecurringExpenseFrequency.WEEKLY]: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50',
  [RecurringExpenseFrequency.MONTHLY]: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/50',
  [RecurringExpenseFrequency.BIMONTHLY]: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/50',
  [RecurringExpenseFrequency.QUARTERLY]: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50',
  [RecurringExpenseFrequency.YEARLY]: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/50',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function RecurringCard({ item, onDelete, onGenerate, canWrite }: {
  item: RecurringExpense;
  onDelete: () => void;
  onGenerate: () => void;
  canWrite: boolean;
}) {
  return (
    <div className="group border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all bg-card">
      <div className="flex items-start gap-4">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          item.isActive ? 'bg-primary/10' : 'bg-muted'
        )}>
          <Repeat className={cn('h-5 w-5', item.isActive ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium truncate">{item.description}</h3>
            <span className="text-lg font-bold tabular-nums text-primary shrink-0">
              {formatCurrency(Number(item.totalAmount))}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full font-medium', FREQUENCY_COLORS[item.frequency])}>
              {FREQUENCY_LABELS[item.frequency]}
            </span>
            {item.category && (
              <Badge variant="secondary" className="text-xs gap-1">
                {item.category.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.startDate)} — {formatDate(item.endDate)}
            </span>
            {item.lastGeneratedDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última: {formatDate(item.lastGeneratedDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onGenerate}
                title="Generar gastos ahora"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/gastos/recurrentes/${item.id}`} className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      {!item.isActive && (
        <div className="mt-3 pt-3 border-t">
          <Badge variant="secondary" className="text-xs gap-1">
            <Pause className="h-3 w-3" />
            Gasto inactivo — no se generará automáticamente
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function RecurrentesPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState<RecurringExpense | null>(null);
  const [itemToGenerate, setItemToGenerate] = useState<RecurringExpense | null>(null);
  const canWrite = useHasProfessionalPlan();
  const prefetch = usePrefetchRecurringExpense();

  const { data, isLoading, error, refetch } = useRecurringExpenses({
    search: search || undefined,
    page,
    limit: 20,
  });

  const deleteMutation = useDeleteRecurringExpense();
  const generateMutation = useGenerateRecurringExpenses();

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  const handleGenerate = async () => {
    if (!itemToGenerate) return;
    await generateMutation.mutateAsync({ id: itemToGenerate.id });
    setItemToGenerate(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/gastos" className="hover:text-foreground flex items-center gap-1">
            Gastos
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span>Recurrentes</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Gastos recurrentes</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Error al cargar los gastos recurrentes.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && total === 0 && !search) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/gastos" className="hover:text-foreground flex items-center gap-1">
            Gastos
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span>Recurrentes</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos recurrentes</h1>
            <p className="text-sm text-muted-foreground">Suscripciones y gastos periódicos</p>
          </div>
          {canWrite && (
            <Link href="/dashboard/gastos/recurrentes/nuevo">
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo recurrente</Button>
            </Link>
          )}
        </div>
        <EmptyState
          icon={Repeat}
          title="Añade tu primer gasto recurrente"
          description="Registra suscripciones o pagos periódicos para generarlos automáticamente."
          action={
            canWrite ? (
              <Link href="/dashboard/gastos/recurrentes/nuevo">
                <Button><Plus className="mr-2 h-4 w-4" />Crear recurrente</Button>
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/gastos" className="hover:text-foreground flex items-center gap-1 transition-colors">
          Gastos
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="font-medium text-foreground">Recurrentes</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos recurrentes</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {isLoading ? <Skeleton className="h-4 w-32" /> : `${total} recurrente${total !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/gastos">
            <Button variant="outline">
              <Receipt className="mr-2 h-4 w-4" />
              Ver todos los gastos
            </Button>
          </Link>
          {canWrite && (
            <Link href="/dashboard/gastos/recurrentes/nuevo">
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo recurrente</Button>
            </Link>
          )}
        </div>
      </div>

      {!canWrite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
          <p className="font-medium text-amber-800 dark:text-amber-300">Modo solo lectura</p>
          <p className="text-amber-700/80 dark:text-amber-400/80">
            Los gastos recurrentes requieren el plan PRO.{' '}
            <Link href="/dashboard/ajustes/plan" className="underline font-medium">Actualiza a PRO</Link>.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por concepto..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-sm text-muted-foreground mt-1">Ningún recurrente coincide con la búsqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onDelete={() => setItemToDelete(item)}
              onGenerate={() => setItemToGenerate(item)}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      {total > 10 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {data?.meta.totalPages ?? 1} · {total} recurrente{total !== 1 ? 's' : ''} en total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (data?.meta.totalPages ?? 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto recurrente</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{itemToDelete?.description}</strong>. Los gastos ya generados no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToGenerate} onOpenChange={() => setItemToGenerate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar gastos</AlertDialogTitle>
            <AlertDialogDescription>
              Se crearán gastos para <strong>{itemToGenerate?.description}</strong> desde la última fecha generada (o el inicio) hasta hoy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generateMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Generando...' : 'Generar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
