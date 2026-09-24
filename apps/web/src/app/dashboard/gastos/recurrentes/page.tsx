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
} from 'lucide-react';
import { RecurringExpense, RecurringExpenseFrequency, QueryRecurringExpensesInput } from '@easyfactura/shared-types';
import {
  useRecurringExpenses,
  useDeleteRecurringExpense,
  useGenerateRecurringExpenses,
  usePrefetchRecurringExpense,
} from '@/hooks/use-recurring-expenses';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { EmptyState } from '@/components/common/empty-state';

const FREQUENCY_LABELS: Record<RecurringExpenseFrequency, string> = {
  [RecurringExpenseFrequency.WEEKLY]: 'Semanal',
  [RecurringExpenseFrequency.MONTHLY]: 'Mensual',
  [RecurringExpenseFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringExpenseFrequency.QUARTERLY]: 'Trimestral',
  [RecurringExpenseFrequency.YEARLY]: 'Anual',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-ES');
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {['Concepto', 'Frecuencia', 'Inicio', 'Importe', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="p-4 text-left text-sm font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[200, 100, 100, 100, 80, 40].map((w, j) => (
                  <td key={j} className="p-4"><Skeleton className="h-4" style={{ width: w }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
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
    limit: 10,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos recurrentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? <Skeleton className="h-4 w-32" /> : `${total} recurrente${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        {canWrite && (
          <Link href="/dashboard/gastos/recurrentes/nuevo">
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo recurrente</Button>
          </Link>
        )}
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por concepto..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-sm text-muted-foreground mt-1">Ningún recurrente coincide con la búsqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Frecuencia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Inicio / Fin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Importe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                      onMouseEnter={() => prefetch(item.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.description}</div>
                        {item.category && <div className="text-xs text-muted-foreground">{item.category.name}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">{FREQUENCY_LABELS[item.frequency]}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(item.startDate)} — {formatDate(item.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium tabular-nums">
                        {formatCurrency(Number(item.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        {item.isActive ? (
                          <Badge variant="default" className="text-xs">Activo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!canWrite}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/gastos/recurrentes/${item.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setItemToGenerate(item)}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Generar gastos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setItemToDelete(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
