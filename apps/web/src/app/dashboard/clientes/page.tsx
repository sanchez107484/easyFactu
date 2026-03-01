'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CustomerType, Customer } from '@easyfactura/shared-types';
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { useSortTable, sortData } from '@/hooks/use-sort-table';
import { SortableHeader } from '@/components/common/sortable-header';

function getCustomerSortValue(customer: Customer, key: string): string | number {
  switch (key) {
    case 'name':
      return customer.name;
    case 'nif':
      return customer.nif;
    case 'city':
      return customer.city ?? '';
    case 'type':
      return customer.type;
    default:
      return '';
  }
}

// ==================== CONSTANTS ====================

const TYPE_LABELS: Record<CustomerType, string> = {
  [CustomerType.INDIVIDUAL]: 'Particular',
  [CustomerType.SELF_EMPLOYED]: 'Autonomo',
  [CustomerType.COMPANY]: 'Empresa',
  [CustomerType.INTRACOMMUNITY]: 'Intracomunitario',
};

const TYPE_BADGE_VARIANT: Record<CustomerType, 'default' | 'secondary' | 'outline'> = {
  [CustomerType.INDIVIDUAL]: 'outline',
  [CustomerType.SELF_EMPLOYED]: 'secondary',
  [CustomerType.COMPANY]: 'default',
  [CustomerType.INTRACOMMUNITY]: 'outline',
};

// ==================== SUB-COMPONENTS ====================

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {['Nombre', 'NIF', 'Email', 'Ciudad', 'Tipo', 'Acciones'].map((h) => (
                <th key={h} className="p-4 text-left text-sm font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[200, 100, 160, 80, 80, 40].map((w, j) => (
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
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        {filtered ? (
          <>
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Sin resultados</h3>
            <p className="text-muted-foreground text-sm text-center">
              Ningún cliente coincide con los filtros aplicados.
            </p>
          </>
        ) : (
          <>
            <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Añade tu primer cliente</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Los clientes son esenciales para facturar. Crea tu primer cliente para empezar.
            </p>
            <Link href="/dashboard/clientes/nuevo">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primer cliente
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface DeleteDialogProps {
  customer: Customer | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({ customer, onCancel, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <AlertDialog open={!!customer}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion desactivara al cliente <strong>{customer?.name}</strong>. No podras
            seleccionarlo en nuevas facturas, pero las facturas existentes no se veran afectadas.
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
            {isPending ? 'Eliminando...' : 'Eliminar cliente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== PAGE ====================

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { sortKey, sortDir, handleSort } = useSortTable('name', 'asc');

  // Query params para el hook
  const queryParams: Record<string, any> = {};
  if (statusFilter === 'ACTIVE') queryParams.active = true;
  if (statusFilter === 'INACTIVE') queryParams.active = false;

  const { data, isLoading, error } = useCustomers(queryParams);
  const deleteMutation = useDeleteCustomer();

  const allCustomers = data?.data ?? [];

  const filteredCustomers = useMemo(() => {
    let result = allCustomers;
    if (typeFilter !== 'ALL') {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.nif.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term),
      );
    }
    return sortData(result, sortKey, sortDir, getCustomerSortValue);
  }, [allCustomers, search, typeFilter, sortKey, sortDir]);

  const isFiltered = search.trim().length > 0 || typeFilter !== 'ALL' || statusFilter !== 'ACTIVE';

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    await deleteMutation.mutateAsync(customerToDelete.id);
    setCustomerToDelete(null);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium">Error al cargar los clientes.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Recarga la pagina para intentarlo de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DeleteDialog
        customer={customerToDelete}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${allCustomers.length} cliente${allCustomers.length !== 1 ? 's' : ''} en total`
              )}
            </div>
          </div>
          <Link href="/dashboard/clientes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre, NIF, email o ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as CustomerType | 'ALL')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Todos los tipos
                    </div>
                  </SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  <SelectItem value="ALL">Todos</SelectItem>
                </SelectContent>
              </Select>

              {isFiltered && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Limpiar
                </Button>
              )}
            </div>

            {isFiltered && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Mostrando {filteredCustomers.length} de {allCustomers.length} clientes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState filtered={isFiltered} />
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
                        sortKey="nif"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                        Email
                      </th>
                      <SortableHeader
                        label="Ciudad"
                        sortKey="city"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden lg:table-cell"
                      />
                      <SortableHeader
                        label="Tipo"
                        sortKey="type"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/dashboard/clientes/${customer.id}`}
                            className="font-medium hover:underline hover:text-primary"
                          >
                            {customer.name}
                          </Link>
                          {customer.legalName && customer.legalName !== customer.name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
                              {customer.legalName}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-sm font-mono text-muted-foreground">
                          {customer.nif}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {customer.email ?? <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="p-4 text-sm hidden lg:table-cell">
                          {customer.city ? (
                            `${customer.city}${customer.province ? `, ${customer.province}` : ''}`
                          ) : (
                            <span className="italic text-muted-foreground opacity-50">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={TYPE_BADGE_VARIANT[customer.type]}>
                            {TYPE_LABELS[customer.type]}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/clientes/${customer.id}`}
                                  className="flex items-center"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/clientes/${customer.id}/editar`}
                                  className="flex items-center"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setCustomerToDelete(customer)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
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
      </div>
    </>
  );
}
