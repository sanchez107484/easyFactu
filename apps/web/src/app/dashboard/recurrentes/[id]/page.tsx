'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Pause,
  Play,
  SkipForward,
  Zap,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  useRecurringInvoice,
  useGeneratedInvoices,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useSkipNextRecurringInvoice,
  useGenerateNowRecurringInvoice,
  useDeleteRecurringInvoice,
  useUpdateRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { RecurringFrequency, RecurringStatus, InvoiceStatus, PaymentMethod } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';

// ==================== CONSTANTS ====================

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.MONTHLY]: 'Mensual',
  [RecurringFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringFrequency.QUARTERLY]: 'Trimestral',
  [RecurringFrequency.SEMIANNUAL]: 'Semestral',
  [RecurringFrequency.ANNUAL]: 'Anual',
};

const STATUS_CONFIG: Record<
  RecurringStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [RecurringStatus.ACTIVE]: { label: 'Activa', variant: 'default' },
  [RecurringStatus.PAUSED]: { label: 'Pausada', variant: 'secondary' },
  [RecurringStatus.COMPLETED]: { label: 'Completada', variant: 'outline' },
  [RecurringStatus.CANCELLED]: { label: 'Cancelada', variant: 'destructive' },
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.CONFIRMED]: 'Confirmada',
  [InvoiceStatus.SENT]: 'Enviada',
  [InvoiceStatus.PAID]: 'Pagada',
  [InvoiceStatus.PROFORMA]: 'Proforma',
  [InvoiceStatus.RECTIFIED]: 'Rectificada',
};

// ==================== HELPERS ====================

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0]!.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// ==================== PAGE ====================

export default function RecurrenteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const { data: recurring, isLoading } = useRecurringInvoice(id);
  const [generatedPage, setGeneratedPage] = useState(1);
  const { data: generatedData, isLoading: isLoadingGenerated } = useGeneratedInvoices(
    id,
    generatedPage,
    10,
  );

  const pauseMutation = usePauseRecurringInvoice();
  const resumeMutation = useResumeRecurringInvoice();
  const skipMutation = useSkipNextRecurringInvoice();
  const generateNowMutation = useGenerateNowRecurringInvoice();
  const deleteMutation = useDeleteRecurringInvoice();
  const updateMutation = useUpdateRecurringInvoice(id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  // MISSING-02: inline nextRunDate editor
  const [editingNextRunDate, setEditingNextRunDate] = useState(false);
  const [nextRunDateInput, setNextRunDateInput] = useState('');

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!recurring) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-muted-foreground">Factura recurrente no encontrada.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[recurring.status];
  const isActive = recurring.status === RecurringStatus.ACTIVE;
  const isPaused = recurring.status === RecurringStatus.PAUSED;
  const isFinished =
    recurring.status === RecurringStatus.COMPLETED ||
    recurring.status === RecurringStatus.CANCELLED;

  const showNextRunDate = isActive && recurring.nextRunDate;

  // UX-03: Payment details
  const paymentDetails = recurring.paymentDetails as Record<string, string> | null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5">
            <Link href="/dashboard/recurrentes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{recurring.name}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {recurring.customer?.name} · {FREQUENCY_LABELS[recurring.frequency]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!isFinished && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/recurrentes/${id}/editar`}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Link>
            </Button>
          )}

          {isActive && (
            <>
              {/* MISSING-06: Generate now */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateNowMutation.mutate(id)}
                disabled={generateNowMutation.isPending}
              >
                {generateNowMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-1" />
                )}
                Generar ahora
              </Button>

              {/* MISSING-03: Skip next */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkipDialog(true)}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Saltar siguiente
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseMutation.mutate(id)}
                disabled={pauseMutation.isPending}
              >
                {pauseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4 mr-1" />
                )}
                Pausar
              </Button>
            </>
          )}

          {isPaused && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resumeMutation.mutate(id)}
              disabled={resumeMutation.isPending}
            >
              {resumeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Reanudar
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Configuration card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Frecuencia</p>
            <p className="font-medium">{FREQUENCY_LABELS[recurring.frequency]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Día del mes</p>
            <p className="font-medium">Día {recurring.dayOfMonth}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Inicio</p>
            <p className="font-medium">{formatDate(recurring.startDate)}</p>
          </div>
          {recurring.endDate && (
            <div>
              <p className="text-muted-foreground">Fin</p>
              <p className="font-medium">{formatDate(recurring.endDate)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Generadas</p>
            <p className="font-medium">
              {recurring.occurrencesCount}
              {recurring.maxOccurrences ? ` / ${recurring.maxOccurrences}` : ''}
            </p>
          </div>
          {recurring.lastRunAt && (
            <div>
              <p className="text-muted-foreground">Última generación</p>
              <p className="font-medium">{formatDate(recurring.lastRunAt)}</p>
            </div>
          )}

          {/* Próxima generación — UX-01: only shown when active */}
          <div className="col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Próxima generación</p>
              {/* MISSING-02: Edit nextRunDate button */}
              {isActive && !editingNextRunDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setNextRunDateInput(recurring.nextRunDate ?? '');
                    setEditingNextRunDate(true);
                  }}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Corregir fecha
                </Button>
              )}
            </div>
            {editingNextRunDate ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="date"
                  value={nextRunDateInput}
                  onChange={(e) => setNextRunDateInput(e.target.value)}
                  className="h-7 text-sm"
                />
                <Button
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    updateMutation.mutate(
                      { nextRunDate: nextRunDateInput },
                      { onSuccess: () => setEditingNextRunDate(false) },
                    );
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => setEditingNextRunDate(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <p className="font-medium">
                {showNextRunDate ? (
                  formatDate(recurring.nextRunDate!)
                ) : isPaused ? (
                  <span className="text-muted-foreground italic">Pausada</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Líneas de factura</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium text-muted-foreground">Descripción</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Cant.</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Precio</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">IVA</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">IRPF</th>
              </tr>
            </thead>
            <tbody>
              {(recurring.lines as unknown as Array<Record<string, unknown>>).map((line, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{String(line['description'] ?? '')}</td>
                  <td className="py-2 text-right">{Number(line['quantity'] ?? 0)}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(Number(line['unitPrice'] ?? 0))}
                  </td>
                  <td className="py-2 text-right">{Number(line['taxRate'] ?? 0)}%</td>
                  <td className="py-2 text-right">
                    {line['irpfRate'] != null ? `${Number(line['irpfRate'])}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals summary */}
          {(recurring.discountPercent || recurring.irpfPercent) && (
            <div className="mt-3 pt-3 border-t text-sm space-y-1">
              {recurring.discountPercent && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento global</span>
                  <span>{Number(recurring.discountPercent)}%</span>
                </div>
              )}
              {recurring.irpfPercent && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IRPF global</span>
                  <span>{Number(recurring.irpfPercent)}%</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UX-03: Full payment details */}
      {(recurring.paymentMethod || paymentDetails) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pago</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {recurring.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">
                  {PAYMENT_METHOD_LABELS[recurring.paymentMethod as PaymentMethod]}
                </span>
              </div>
            )}
            {paymentDetails?.iban && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-mono">{paymentDetails.iban}</span>
              </div>
            )}
            {paymentDetails?.bic && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">BIC/SWIFT</span>
                <span className="font-mono">{paymentDetails.bic}</span>
              </div>
            )}
            {paymentDetails?.accountHolder && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titular</span>
                <span>{paymentDetails.accountHolder}</span>
              </div>
            )}
            {paymentDetails?.bizumPhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono Bizum</span>
                <span>{paymentDetails.bizumPhone}</span>
              </div>
            )}
            {paymentDetails?.paypalEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email PayPal</span>
                <span>{paymentDetails.paypalEmail}</span>
              </div>
            )}
            {paymentDetails?.paymentNote && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nota</span>
                <span>{paymentDetails.paymentNote}</span>
              </div>
            )}
            {recurring.dueDays != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento</span>
                <span>{recurring.dueDays} días</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MISSING-01: Generated invoices list with navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Facturas generadas
              {generatedData?.meta.total ? (
                <span className="ml-2 text-muted-foreground font-normal text-sm">
                  ({generatedData.meta.total})
                </span>
              ) : null}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingGenerated ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !generatedData?.data.length ? (
            <div className="py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no se han generado facturas
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      Número
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {generatedData.data.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {log.invoice?.number ?? 'Sin número'}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.invoice?.issueDate ? formatDate(log.invoice.issueDate) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {log.invoice?.total != null
                          ? formatCurrency(Number(log.invoice.total))
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs">
                          {INVOICE_STATUS_LABELS[log.invoice?.status ?? ''] ?? log.invoice?.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/facturas/${log.invoiceId}`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination for generated invoices */}
              {(generatedData.meta.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    {generatedData.meta.total} facturas generadas
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGeneratedPage((p) => Math.max(1, p - 1))}
                      disabled={generatedPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {generatedPage} / {generatedData.meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setGeneratedPage((p) =>
                          Math.min(generatedData.meta.totalPages, p + 1),
                        )
                      }
                      disabled={generatedPage >= generatedData.meta.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {recurring.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{recurring.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Skip dialog — MISSING-03 */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Saltar la siguiente generación?</AlertDialogTitle>
            <AlertDialogDescription>
              La próxima factura programada para{' '}
              {recurring.nextRunDate ? formatDate(recurring.nextRunDate) : 'la fecha próxima'} no
              se generará. La siguiente generación se pospondrá al siguiente período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                skipMutation.mutate(id, {
                  onSettled: () => setShowSkipDialog(false),
                });
              }}
              disabled={skipMutation.isPending}
            >
              {skipMutation.isPending ? 'Saltando...' : 'Saltar generación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente "{recurring.name}". Las facturas ya
              generadas no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(id, {
                  onSuccess: () => router.push('/dashboard/recurrentes'),
                });
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
