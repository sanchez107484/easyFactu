'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  AlertCircle,
  X,
  Euro,
  Calendar,
} from 'lucide-react';
import { Expense, ExpenseCategory, Supplier, QueryExpensesInput } from '@easyfactura/shared-types';
import {
  useExpenses,
  useDeleteExpense,
  usePrefetchExpense,
  useExpenseSummary,
} from '@/hooks/use-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useSortTable } from '@/hooks/use-sort-table';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { SortableHeader } from '@/components/common/sortable-header';
import { EmptyState } from '@/components/common/empty-state';

// ==================== HELPERS ====================

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ==================== SUB-COMPONENTS ====================

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {['Fecha', 'Concepto', 'Categoría', 'Proveedor', 'Total', 'Acciones'].map((h) => (
                <th key={h} className="p-4 text-left text-sm font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[80, 200, 120, 120, 80, 40].map((w, j) => (
                  <td key={j} className="p-4">
                    <Skeleton className="h-4" style={{ width: w }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SummaryCards({ monthTotal, yearTotal, isLoading }: { monthTotal: number; yearTotal: number; isLoading: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Este mes</p>
            <p className="text-2xl font-bold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(monthTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Euro className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Este año</p>
            <p className="text-2xl font-bold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(yearTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DeleteDialogProps {
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({ expense, onCancel, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <AlertDialog open={!!expense}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el gasto <strong>{expense?.description}</strong> permanentemente. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Eliminando...' : 'Eliminar gasto'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== PAGE ====================

export default function GastosPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const { sortKey, sortDir, handleSort } = useSortTable('date', 'desc');

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, supplierFilter, sortKey, sortDir]);

  const { data, isLoading, error, refetch } = useExpenses({
    search: search || undefined,
    categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    supplierId: supplierFilter !== 'ALL' ? supplierFilter : undefined,
    sortBy: sortKey as QueryExpensesInput['sortBy'],
    sortOrder: sortDir,
    page,
    limit: 10,
  });

  const { data: summaryData, isLoading: isSummaryLoading } = useExpenseSummary();
  const { data: categoriesData } = useExpenseCategories();
  const { data: suppliersData } = useSuppliers({ limit: 500 });
  const deleteMutation = useDeleteExpense();
  const prefetchExpense = usePrefetchExpense();

  const expenses = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const categories = categoriesData ?? [];
  const suppliers = suppliersData?.data ?? [];
  const canWrite = useHasProfessionalPlan();

  const isFiltered =
    searchInput.trim().length > 0 || categoryFilter !== 'ALL' || supplierFilter !== 'ALL';

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    await deleteMutation.mutateAsync(expenseToDelete.id);
    setExpenseToDelete(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Error al cargar los gastos.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !error && total === 0 && !isFiltered) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
            <p className="text-sm text-muted-foreground">Registra los gastos de tu actividad</p>
          </div>
          {canWrite && (
            <Link href="/dashboard/gastos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo gasto
              </Button>
            </Link>
          )}
        </div>

        <SummaryCards
          monthTotal={summaryData?.monthTotal ?? 0}
          yearTotal={summaryData?.yearTotal ?? 0}
          isLoading={isSummaryLoading}
        />

        {!canWrite ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No hay gastos registrados</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                El registro de gastos está disponible en el plan PRO. Actualiza tu suscripción para
                empezar.
              </p>
              <Link href="/dashboard/ajustes/plan">
                <Button className="mt-4">
                  Ver planes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Añade tu primer gasto"
            description="Registra tus gastos para tener una visión completa de tu actividad."
            action={
              <Link href="/dashboard/gastos/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer gasto
                </Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  return (
    <>
      <DeleteDialog
        expense={expenseToDelete}
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${total} gasto${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
              )}
            </div>
          </div>
          {canWrite && (
            <Link href="/dashboard/gastos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo gasto
              </Button>
            </Link>
          )}
        </div>

        {/* Read-only banner */}
        {!canWrite && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Modo solo lectura
            </p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              Tu plan actual no permite crear, editar ni eliminar gastos.{' '}
              <Link href="/dashboard/ajustes/plan" className="underline font-medium">
                Actualiza a PRO
              </Link>{' '}
              para recuperar el control.
            </p>
          </div>
        )}

        {/* Summary */}
        <SummaryCards
          monthTotal={summaryData?.monthTotal ?? 0}
          yearTotal={summaryData?.yearTotal ?? 0}
          isLoading={isSummaryLoading}
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por concepto o proveedor..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las categorías</SelectItem>
                  {categories.map((category: ExpenseCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los proveedores</SelectItem>
                  {suppliers.map((supplier: Supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isFiltered && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                {total} gasto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton />
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Sin resultados</p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay gastos que coincidan con los filtros aplicados.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchInput('');
                  setCategoryFilter('ALL');
                  setSupplierFilter('ALL');
                }}
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <SortableHeader
                        label="Fecha"
                        sortKey="date"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="px-4"
                      />
                      <SortableHeader
                        label="Concepto"
                        sortKey="description"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="px-4"
                      />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Proveedor
                      </th>
                      <SortableHeader
                        label="Total"
                        sortKey="totalAmount"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                      />
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-muted/30 transition-colors"
                        onMouseEnter={() => prefetchExpense(expense.id)}
                        onFocus={() => prefetchExpense(expense.id)}
                      >
                        <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/gastos/${expense.id}`}
                            className="font-medium hover:underline hover:text-primary"
                          >
                            {expense.description}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.category?.name ?? (
                            <span className="italic text-muted-foreground opacity-50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.supplier?.name ?? (
                            <span className="italic text-muted-foreground opacity-50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(expense.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canWrite ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/gastos/${expense.id}`}
                                    className="flex items-center"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setExpenseToDelete(expense)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                              <Link href={`/dashboard/gastos/${expense.id}`}>Ver</Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!error && !isLoading && data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {page} de {data.meta.totalPages} &middot; {total} gasto
              {total !== 1 ? 's' : ''} en total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
