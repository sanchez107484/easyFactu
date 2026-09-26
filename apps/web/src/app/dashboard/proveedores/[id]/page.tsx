'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  Plus,
  TrendingUp,
  Receipt,
  Clock,
} from 'lucide-react';
import { useSortTable, sortData, SortDir } from '@/hooks/use-sort-table';
import { SortableHeader } from '@/components/common/sortable-header';
import { useSupplier, useDeleteSupplier } from '@/hooks/use-suppliers';
import { useExpenses } from '@/hooks/use-expenses';
import { cn, formatCurrency } from '@/lib/utils';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildAddress(supplier: { address?: string | null; postalCode?: string | null; city?: string | null; province?: string | null }): string | null {
  const parts = [
    supplier.address,
    [supplier.postalCode, supplier.city].filter(Boolean).join(' '),
    supplier.province,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProveedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<string>('desc');

  const { data: supplier, isLoading: loadingSupplier, isError } = useSupplier(id);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses({
    supplierId: id,
    limit: 100,
  });
  const deleteMutation = useDeleteSupplier();

  const expenses = expensesData?.data ?? [];

  const sortDataLocal = (data: typeof expenses, key: string, dir: SortDir) => {
    return sortData(data, key, dir, (expense: typeof expenses[0], k: string) => {
      switch (k) {
        case 'date':
          return expense.date ?? '';
        case 'description':
          return expense.description ?? '';
        case 'totalAmount':
          return Number(expense.totalAmount);
        default:
          return '';
      }
    });
  };

  const sortedExpenses = sortDataLocal(expenses, sortKey, sortDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const lastExpense = expenses
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/proveedores');
  };

  if (loadingSupplier) {
    return (
      <div>
        <PageSkeleton />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/proveedores">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Proveedores
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No se ha podido cargar la información del proveedor.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const address = buildAddress(supplier);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/proveedores">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{supplier.name}</h1>
              <Badge variant={supplier.isActive ? 'default' : 'secondary'} className="shrink-0">
                {supplier.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {supplier.legalName && (
              <p className="text-sm text-muted-foreground mt-0.5">{supplier.legalName}</p>
            )}
            <p className="text-sm font-mono text-muted-foreground mt-0.5">{supplier.taxId}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pl-11 sm:pl-0">
          <Link href={`/dashboard/proveedores/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </Link>
          <Link href={`/dashboard/gastos/nuevo?supplierId=${id}`}>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuevo gasto
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar proveedor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total gastado"
          value={formatCurrency(totalExpenses)}
          sub={`${expenses.length} gasto${expenses.length !== 1 ? 's' : ''}`}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Receipt}
          label="Último gasto"
          value={lastExpense ? formatCurrency(Number(lastExpense.totalAmount)) : '—'}
          sub={lastExpense ? formatDate(lastExpense.date) : 'Sin gastos aún'}
          color="bg-secondary-50 text-secondary-600 dark:bg-secondary-950/50 dark:text-secondary-400"
        />
        <StatCard
          icon={Clock}
          label="Fecha alta"
          value={formatDate(supplier.createdAt)}
          sub={supplier.name}
          color="bg-muted text-muted-foreground"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Supplier info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Datos del proveedor</CardTitle>
                <Link href={`/dashboard/proveedores/${id}/editar`}>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.email && (
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                    {supplier.email}
                  </a>
                </InfoRow>
              )}

              {supplier.phone && (
                <InfoRow icon={Phone} label="Teléfono">
                  <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                    {supplier.phone}
                  </a>
                </InfoRow>
              )}

              {address && (
                <InfoRow icon={MapPin} label="Dirección">
                  {address}
                </InfoRow>
              )}

              {!supplier.email && !supplier.phone && !address && (
                <p className="text-sm text-muted-foreground">Sin datos de contacto.</p>
              )}

              {supplier.notes && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Notas
                    </p>
                    <p className="text-sm whitespace-pre-line">{supplier.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <InfoRow icon={Calendar} label="Proveedor desde">
                {formatDate(supplier.createdAt)}
              </InfoRow>
            </CardContent>
          </Card>
        </div>

        {/* Right: Expenses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Gastos</CardTitle>
                <Link href={`/dashboard/gastos/nuevo?supplierId=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nuevo gasto
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingExpenses ? (
                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20 hidden sm:block" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin gastos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este proveedor no tiene gastos registrados todavía.
                  </p>
                  <Link href={`/dashboard/gastos/nuevo?supplierId=${id}`} className="mt-4">
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Registrar primer gasto
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/40">
                      <tr className="text-xs">
                        <SortableHeader
                          label="Fecha"
                          sortKey="date"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                          className="px-6"
                        />
                        <SortableHeader
                          label="Descripción"
                          sortKey="description"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                          className="hidden sm:table-cell"
                        />
                        <SortableHeader
                          label="Categoría"
                          sortKey="category"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                          className="hidden md:table-cell"
                        />
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
                      {sortedExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-6 py-3">
                            <span className="text-sm font-medium font-mono">
                              {formatDate(expense.date)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                            <span className="truncate max-w-[200px] block">
                              {expense.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {expense.category && (
                              <Badge variant="secondary" className="text-xs">
                                {expense.category.name}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                            {formatCurrency(Number(expense.totalAmount))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/dashboard/gastos/${expense.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                              >
                                Ver
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará <strong>{supplier.name}</strong>{' '}
              permanentemente, pero sus gastos se conservarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
