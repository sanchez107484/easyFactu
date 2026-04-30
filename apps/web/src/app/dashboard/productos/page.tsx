'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Package,
  Wrench,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  X,
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
import { useProducts, useDeleteProduct, usePrefetchProduct } from '@/hooks/use-products';
import { useSortTable } from '@/hooks/use-sort-table';
import { SortableHeader } from '@/components/common/sortable-header';
import { EmptyState } from '@/components/common/empty-state';
import { Product, ProductType } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const PRODUCT_TYPE_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: ProductType.PRODUCT, label: 'Productos' },
  { value: ProductType.SERVICE, label: 'Servicios' },
];

const TYPE_CONFIG: Record<
  ProductType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  [ProductType.PRODUCT]: {
    label: 'Producto',
    icon: Package,
    color: 'text-product-600 dark:text-product-400',
    bg: 'bg-product-50 dark:bg-product-950/40',
    border: 'border-product-200 dark:border-product-800',
  },
  [ProductType.SERVICE]: {
    label: 'Servicio',
    icon: Wrench,
    color: 'text-product-600 dark:text-product-400',
    bg: 'bg-product-50 dark:bg-product-950/40',
    border: 'border-product-200 dark:border-product-800',
  },
};

// ==================== HELPERS ====================

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// ==================== SUB-COMPONENTS ====================

function ProductTypeBadge({ type }: { type: ProductType }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.bg,
        cfg.border,
        cfg.color,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
          <Skeleton className="h-4 w-16 hidden lg:block" />
          <Skeleton className="h-4 w-14 hidden lg:block" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

// ==================== PAGE ====================

export default function ProductosPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  const { sortKey, sortDir, handleSort } = useSortTable('name', 'asc');

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sortKey, sortDir]);

  const { data, isLoading, error, refetch } = useProducts({
    search: search || undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as ProductType) : undefined,
    sortBy: sortKey,
    sortOrder: sortDir,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteProduct();
  const prefetchProduct = usePrefetchProduct();

  const handleDeleteClick = (product: Product) => {
    setDeleteId(product.id);
    setDeleteName(product.name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    setDeleteName('');
  };

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  if (!isLoading && !error && total === 0 && !search && typeFilter === 'ALL') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Productos y servicios</h1>
            <p className="text-sm text-muted-foreground">Gestiona tu catálogo</p>
          </div>
        </div>
        <EmptyState
          icon={Package}
          title="Añade tu primer producto"
          description="Define tus productos y servicios una vez y reutilízalos en todas tus facturas para facturar más rápido."
          action={
            <Link href="/dashboard/productos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer producto
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos y servicios</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Cargando...'
              : `${total} elemento${total !== 1 ? 's' : ''} en el catálogo`}
          </p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o referencia..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10"
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
        <div className="flex flex-wrap gap-1.5">
          {PRODUCT_TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                typeFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
          {typeFilter !== 'ALL' && (
            <button
              onClick={() => setTypeFilter('ALL')}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="font-medium mb-1">Error al cargar el catálogo</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin resultados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay productos que coincidan con los filtros aplicados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput('');
                    setTypeFilter('ALL');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
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
                        className="px-6"
                      />
                      <SortableHeader
                        label="Referencia"
                        sortKey="reference"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden md:table-cell"
                      />
                      <SortableHeader
                        label="Tipo"
                        sortKey="type"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden sm:table-cell"
                      />
                      <SortableHeader
                        label="Precio base"
                        sortKey="unitPrice"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                      />
                      <SortableHeader
                        label="IVA"
                        sortKey="taxRate"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                        className="hidden lg:table-cell"
                      />
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">
                        PVP
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => {
                      const pvp = product.unitPrice * (1 + product.taxRate / 100);
                      return (
                        <tr
                          key={product.id}
                          className="group hover:bg-muted/30 transition-colors"
                          onMouseEnter={() => prefetchProduct(product.id)}
                          onFocus={() => prefetchProduct(product.id)}
                        >
                          <td className="px-6 py-3">
                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/productos/${product.id}`}
                                className="text-sm font-medium truncate max-w-[240px] hover:underline hover:text-primary block"
                              >
                                {product.name}
                              </Link>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[240px] mt-0.5">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {product.reference ? (
                              <span className="font-mono text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                                {product.reference}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <ProductTypeBadge type={product.type} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums">
                            {formatCurrency(product.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                            {product.taxRate}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums hidden lg:table-cell">
                            {formatCurrency(pvp)}
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/productos/${product.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/productos/${product.id}/editar`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(product)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!error && !isLoading && data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {data.meta.totalPages} &middot; {total} elemento
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

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara <strong>{deleteName}</strong> permanentemente. Esta accion no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Si, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
