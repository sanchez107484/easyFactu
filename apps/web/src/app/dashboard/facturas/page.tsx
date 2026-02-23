'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreVertical,
  Copy,
  CheckCircle2,
  Coins,
  AlertCircle,
} from 'lucide-react';
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
  useInvoices,
  useConfirmInvoice,
  useMarkInvoiceAsPaid,
  useDuplicateInvoice,
  useDeleteInvoice,
} from '@/hooks/use-invoices';
import { InvoiceStatus, Invoice } from '@easyfactura/shared-types';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.CONFIRMED]: 'Confirmada',
  [InvoiceStatus.SENT]: 'Enviada',
  [InvoiceStatus.PAID]: 'Pagada',
  [InvoiceStatus.RECTIFIED]: 'Rectificada',
};

const STATUS_VARIANTS: Record<InvoiceStatus, 'secondary' | 'outline' | 'default' | 'destructive'> =
  {
    [InvoiceStatus.DRAFT]: 'secondary',
    [InvoiceStatus.CONFIRMED]: 'outline',
    [InvoiceStatus.SENT]: 'default',
    [InvoiceStatus.PAID]: 'default',
    [InvoiceStatus.RECTIFIED]: 'destructive',
  };

function InvoiceTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function FacturasPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounced search would be ideal but keep it simple for now
  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as InvoiceStatus) : undefined,
    limit: 50,
  });

  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const duplicateMutation = useDuplicateInvoice();
  const deleteMutation = useDeleteInvoice();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleDuplicate = async (invoice: Invoice) => {
    const newInvoice = await duplicateMutation.mutateAsync(invoice.id);
    router.push(`/dashboard/facturas/${newInvoice.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <Card>
          <InvoiceTableSkeleton />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Error al cargar las facturas</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invoices = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  if (invoices.length === 0 && !search && statusFilter === 'ALL') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground">Gestiona tus facturas</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Crea tu primera factura</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Genera facturas profesionales en segundos. Cumple con VeriFactu automáticamente.
            </p>
            <Link href="/dashboard/facturas/nueva">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primera factura
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            {total} factura{total !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value={InvoiceStatus.DRAFT}>Borradores</SelectItem>
                <SelectItem value={InvoiceStatus.CONFIRMED}>Confirmadas</SelectItem>
                <SelectItem value={InvoiceStatus.SENT}>Enviadas</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>Pagadas</SelectItem>
                <SelectItem value={InvoiceStatus.RECTIFIED}>Rectificadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No se encontraron facturas con estos filtros</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Número</th>
                    <th className="p-4 text-left text-sm font-medium">Cliente</th>
                    <th className="p-4 text-left text-sm font-medium">Fecha</th>
                    <th className="p-4 text-right text-sm font-medium">Total</th>
                    <th className="p-4 text-left text-sm font-medium">Estado</th>
                    <th className="p-4 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <Link
                          href={`/dashboard/facturas/${invoice.id}`}
                          className="font-mono font-medium hover:underline"
                        >
                          {invoice.number}
                        </Link>
                        {invoice.isRectificative && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (rectificativa)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm">{invoice.customer?.name ?? '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-4 text-right font-medium tabular-nums">
                        {Number(invoice.total).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </td>
                      <td className="p-4">
                        <Badge variant={STATUS_VARIANTS[invoice.status as InvoiceStatus]}>
                          {STATUS_LABELS[invoice.status as InvoiceStatus]}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/facturas/${invoice.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <DropdownMenuItem
                                onClick={() => confirmMutation.mutate(invoice.id)}
                                disabled={confirmMutation.isPending}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === InvoiceStatus.CONFIRMED ||
                              invoice.status === InvoiceStatus.SENT) && (
                              <DropdownMenuItem
                                onClick={() => paidMutation.mutate(invoice.id)}
                                disabled={paidMutation.isPending}
                              >
                                <Coins className="mr-2 h-4 w-4" />
                                Marcar como pagada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(invoice)}
                              disabled={duplicateMutation.isPending}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteId(invoice.id)}
                                >
                                  Eliminar borrador
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Â¿Eliminar borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acciÃ³n no se puede deshacer. El borrador se eliminarÃ¡ permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'SÃ­, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
