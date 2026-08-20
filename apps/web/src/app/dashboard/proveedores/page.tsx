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
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Truck,
  X,
} from 'lucide-react';
import { Supplier, QuerySuppliersInput } from '@easyfactura/shared-types';
import { useSuppliers, useDeleteSupplier, usePrefetchSupplier } from '@/hooks/use-suppliers';
import { useSortTable } from '@/hooks/use-sort-table';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { SortableHeader } from '@/components/common/sortable-header';
import { EmptyState } from '@/components/common/empty-state';

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
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const { sortKey, sortDir, handleSort } = useSortTable('name', 'asc');

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir]);

  const { data, isLoading, error, refetch } = useSuppliers({
    search: search || undefined,
    sortBy: sortKey as QuerySuppliersInput['sortBy'],
    sortOrder: sortDir,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteSupplier();
  const prefetchSupplier = usePrefetchSupplier();

  const suppliers = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
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
                `${total} proveedor${total !== 1 ? 'es' : ''} registrado${total !== 1 ? 's' : ''}`
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

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre, NIF o email..."
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
            </div>
            {search && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                {total} proveedor{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
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
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-muted/30 transition-colors"
                        onMouseEnter={() => prefetchSupplier(supplier.id)}
                        onFocus={() => prefetchSupplier(supplier.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium">{supplier.name}</span>
                          {supplier.legalName && supplier.legalName !== supplier.name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
                              {supplier.legalName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                          {supplier.taxId ?? <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {supplier.email ?? <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm hidden lg:table-cell">
                          {supplier.phone ?? <span className="italic text-muted-foreground opacity-50">—</span>}
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
                                    href={`/dashboard/proveedores/${supplier.id}`}
                                    className="flex items-center"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setSupplierToDelete(supplier)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                              <Link href={`/dashboard/proveedores/${supplier.id}`}>Ver</Link>
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
              Página {page} de {data.meta.totalPages} &middot; {total} proveedor
              {total !== 1 ? 'es' : ''} en total
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
