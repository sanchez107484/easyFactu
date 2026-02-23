'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  AlertDialogTrigger,
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
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  CreditCard,
  Copy,
  RotateCcw,
  AlertCircle,
  FileDown,
} from 'lucide-react';

import {
  useInvoice,
  useConfirmInvoice,
  useMarkInvoiceAsPaid,
  useDuplicateInvoice,
  useDeleteInvoice,
  useRectifyInvoice,
} from '@/hooks/use-invoices';
import { InvoiceStatus } from '@easyfactura/shared-types';

// ==================== HELPERS ====================

const STATUS_LABELS: Record<string, string> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.CONFIRMED]: 'Confirmada',
  [InvoiceStatus.SENT]: 'Enviada',
  [InvoiceStatus.PAID]: 'Pagada',
  [InvoiceStatus.RECTIFIED]: 'Rectificada',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [InvoiceStatus.DRAFT]: 'secondary',
  [InvoiceStatus.CONFIRMED]: 'outline',
  [InvoiceStatus.SENT]: 'default',
  [InvoiceStatus.PAID]: 'default',
  [InvoiceStatus.RECTIFIED]: 'secondary',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

// ==================== LOADING SKELETON ====================

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showRectifyDialog, setShowRectifyDialog] = useState(false);
  const [rectifyReason, setRectifyReason] = useState('');

  const { data: invoice, isLoading, error } = useInvoice(id);
  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const duplicateMutation = useDuplicateInvoice();
  const deleteMutation = useDeleteInvoice();
  const rectifyMutation = useRectifyInvoice();

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync(id);
  };

  const handlePaid = async () => {
    await paidMutation.mutateAsync(id);
  };

  const handleDuplicate = async () => {
    const copy = await duplicateMutation.mutateAsync(id);
    router.push(`/dashboard/facturas/${copy.id}`);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/facturas');
  };

  const handleRectify = async () => {
    if (!rectifyReason.trim()) return;
    const rect = await rectifyMutation.mutateAsync({
      id,
      data: {
        rectificationReason: rectifyReason,
        lines: (invoice!.lines ?? []).map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      },
    });
    setShowRectifyDialog(false);
    router.push(`/dashboard/facturas/${rect.id}`);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const handleDownloadPdf = () => {
    window.open(`${API_URL}/v1/invoices/${id}/pdf`, '_blank');
  };

  if (isLoading) return <InvoiceDetailSkeleton />;

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar la factura</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Link href="/dashboard/facturas">
          <Button variant="outline">Volver a facturas</Button>
        </Link>
      </div>
    );
  }

  const isDraft = invoice.status === InvoiceStatus.DRAFT;
  const isConfirmed = invoice.status === InvoiceStatus.CONFIRMED;
  const isSent = invoice.status === InvoiceStatus.SENT;
  const canPay = isConfirmed || isSent;
  const canRectify = isConfirmed || isSent || invoice.status === InvoiceStatus.PAID;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.number}</h1>
              <Badge variant={STATUS_VARIANT[invoice.status]}>
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </Badge>
              {invoice.isRectificative && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Rectificativa
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Emitida el {formatDate(invoice.issueDate)}
              {invoice.dueDate && ` · Vence el ${formatDate(invoice.dueDate)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar'}
            </Button>
          )}
          {canPay && (
            <Button variant="outline" onClick={handlePaid} disabled={paidMutation.isPending}>
              <CreditCard className="mr-2 h-4 w-4" />
              {paidMutation.isPending ? 'Procesando...' : 'Marcar pagada'}
            </Button>
          )}
          {!isDraft && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isDraft && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/facturas/${id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              {canRectify && (
                <DropdownMenuItem onClick={() => setShowRectifyDialog(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Emitir rectificativa
                </DropdownMenuItem>
              )}
              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El borrador será eliminado
                          permanentemente.
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{invoice.customer?.name}</p>
                <p className="text-muted-foreground">{invoice.customer?.nif}</p>
                {invoice.customer?.address && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer.address}
                    {invoice.customer.postalCode && `, ${invoice.customer.postalCode}`}
                    {invoice.customer.city && ` ${invoice.customer.city}`}
                    {invoice.customer.province && ` (${invoice.customer.province})`}
                  </p>
                )}
                {invoice.customer?.email && (
                  <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Líneas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Descripción</th>
                      <th className="text-right py-2 font-medium w-20">Cant.</th>
                      <th className="text-right py-2 font-medium w-28">Precio</th>
                      <th className="text-right py-2 font-medium w-20">IVA</th>
                      <th className="text-right py-2 font-medium w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.lines ?? []).map((line) => (
                      <tr key={line.id} className="border-b last:border-0">
                        <td className="py-3">{line.description}</td>
                        <td className="py-3 text-right">{line.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                        <td className="py-3 text-right">{line.taxRate}%</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invoice.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Notas
                    </p>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Totals */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base imponible</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountPercent != null && invoice.discountPercent > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({invoice.discountPercent}%)</span>
                  <span>−{formatCurrency(invoice.discountAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatCurrency(invoice.taxTotal)}</span>
              </div>
              {invoice.irpfPercent != null && invoice.irpfPercent > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>IRPF ({invoice.irpfPercent}%)</span>
                  <span>−{formatCurrency(invoice.irpfTotal ?? 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.series && (
                <>
                  <Separator className="mt-2" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Serie</span>
                      <span>{invoice.series.name}</span>
                    </div>
                    {invoice.paymentMethod && (
                      <div className="flex justify-between">
                        <span>Pago</span>
                        <span>{invoice.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rectify dialog */}
      <AlertDialog open={showRectifyDialog} onOpenChange={setShowRectifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir factura rectificativa</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una nueva factura rectificativa basada en esta. Indica el motivo de la
              rectificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Motivo de la rectificación (mínimo 5 caracteres)..."
              value={rectifyReason}
              onChange={(e) => setRectifyReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRectifyReason('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRectify}
              disabled={rectifyReason.trim().length < 5 || rectifyMutation.isPending}
            >
              {rectifyMutation.isPending ? 'Creando...' : 'Crear rectificativa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
