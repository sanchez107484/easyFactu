'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
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
  Users,
  AlertCircle,
  Truck,
  X,
  ChevronRight,
  TruckIcon,
  CheckCircle,
} from 'lucide-react';
import { Supplier, QuerySuppliersInput } from '@easyfactura/shared-types';
import { useSuppliers, useDeleteSupplier, usePrefetchSupplier } from '@/hooks/use-suppliers';
import { useSortTable } from '@/hooks/use-sort-table';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { SortableHeader } from '@/components/common/sortable-header';
import { EmptyState } from '@/components/common/empty-state';
import { cn, formatCurrency } from '@/lib/utils';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold shrink-0 select-none',
        sizeClass,
        getAvatarColor(name),
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {['Nombre', 'NIF', 'Email', 'Teléfono', 'Acciones'].map((h) => (
                <th key={h} className="p-4 text-left text-sm font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[200, 100, 160, 80, 40].map((w, j) => (
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

interface DeleteDialogProps {
  supplier: Supplier | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({ supplier, onCancel, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <AlertDialog open={!!supplier}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará <strong>{supplier?.name}</strong> permanentemente. Esta acción no se puede deshacer.
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
            {isPending ? 'Eliminando...' : 'Eliminar proveedor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== PAGE ====================

export default function ProveedoresPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const { sortKey, sortDir, handleSort } = useSortTable('name', 'asc');

  const { data, isLoading, error, refetch } = useSuppliers({
    search: search || undefined,
    sortBy: sortKey as QuerySuppliersInput['sortBy'],
    sortOrder: sortDir,
    limit: 100,
    limit: 100,
  });

  const deleteMutation = useDeleteSupplier();
  const prefetchSupplier = usePrefetchSupplier();

  const allSuppliers = data?.data ?? [];
  const filteredSuppliers = statusFilter === 'ALL'
    ? allSuppliers
    : statusFilter === 'ACTIVE'
    ? allSuppliers.filter(s => s.isActive)
    : allSuppliers.filter(s => !s.isActive);

  const suppliers = filteredSuppliers;
  const total = filteredSuppliers.length;
  const activeCount = allSuppliers.filter(s => s.isActive).length;
  const canWrite = useHasProfessionalPlan();

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    await deleteMutation.mutateAsync(supplierToDelete.id);
    setSupplierToDelete(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Error al cargar los proveedores.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !error && total === 0 && !search) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-sm text-muted-foreground">Gestiona los proveedores de tu actividad</p>
          </div>
          {canWrite && (
            <Link href="/dashboard/proveedores/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo proveedor
              </Button>
            </Link>
          )}
        </div>
        {!canWrite ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No hay proveedores registrados</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                La gestión de proveedores está disponible en el plan PRO. Actualiza tu suscripción para
                empezar.
              </p>
              <Link href="/dashboard/ajustes/plan">
                <Button className="mt-4">Ver planes</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Truck}
            title="Añade tu primer proveedor"
            description="Registra a tus proveedores para asociarlos fácilmente a tus gastos."
            action={
              <Link href="/dashboard/proveedores/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer proveedor
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
        supplier={supplierToDelete}
        onCancel={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  {statusFilter !== 'ALL' || searchInput
                    ? `${total} de ${allSuppliers.length} proveedor${allSuppliers.length !== 1 ? 'es' : ''}`
                    : `${total} proveedor${total !== 1 ? 'es' : ''} registrado${total !== 1 ? 's' : ''}`
                  }
                </>
              )}
            </div>
          </div>
          {canWrite && (
            <Link href="/dashboard/proveedores/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo proveedor
              </Button>
            </Link>
          )}
        </div>

        {/* Read-only banner */}
        {!canWrite && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
            <p className="font-medium text-amber-800 dark:text-amber-300">Modo solo lectura</p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              Tu plan actual no permite crear, editar ni eliminar proveedores.{' '}
              <Link href="/dashboard/ajustes/plan" className="underline font-medium">
                Actualiza a PRO
              </Link>{' '}
              para recuperar el control.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('ALL')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0">
                <TruckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allSuppliers.length}</p>
                <p className="text-xs text-muted-foreground">Proveedores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('ACTIVE')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('INACTIVE')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                <TruckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allSuppliers.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Inactivos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre, NIF o email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status filter pills */}
              <div className="flex gap-1.5">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {status === 'ALL' ? 'Todos' : status === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton />
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Sin resultados</p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay proveedores que coincidan con la búsqueda.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSearchInput('')}
              >
                Limpiar búsqueda
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
                        label="Nombre"
                        sortKey="name"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="px-4"
                      />
                      <SortableHeader
                        label="NIF"
                        sortKey="taxId"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                        Teléfono
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden xl:table-cell">
                        Gastos
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/dashboard/proveedores/${supplier.id}`)}
                        onMouseEnter={() => prefetchSupplier(supplier.id)}
                        onFocus={() => prefetchSupplier(supplier.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={supplier.name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate max-w-[180px]">{supplier.name}</span>
                                {!supplier.isActive && (
                                  <Badge variant="secondary" className="text-[10px] shrink-0">Inactivo</Badge>
                                )}
                              </div>
                              {supplier.legalName && supplier.legalName !== supplier.name && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {supplier.legalName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                          <span title={supplier.taxId ?? undefined}>
                            {supplier.taxId ?? <span className="italic opacity-50">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          <span className="truncate block max-w-[160px]" title={supplier.email ?? undefined}>
                            {supplier.email ?? <span className="italic opacity-50">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                          {supplier.phone ?? <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right hidden xl:table-cell">
                          {supplier.expenseCount != null && supplier.expenseCount > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-semibold tabular-nums">
                                {formatCurrency(supplier.totalExpenses ?? 0)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {supplier.expenseCount} gasto{supplier.expenseCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic opacity-50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            {canWrite ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/dashboard/proveedores/${supplier.id}/editar`}
                                      className="flex items-center"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSupplierToDelete(supplier);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Count footer */}
        {!error && !isLoading && total > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {total} proveedor{total !== 1 ? 'es' : ''}
            {statusFilter !== 'ALL' || searchInput ? ' de los ' + allSuppliers.length + ' totales' : ''}
          </p>
        )}
      </div>
    </>
  );
}
