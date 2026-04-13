'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  Trash2,
  SkipForward,
  Zap,
  Edit,
  Check,
  X,
} from 'lucide-react';
import {
  useRecurringInvoice,
  useUpdateRecurringInvoice,
  useDeleteRecurringInvoice,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useSkipNextRecurringInvoice,
  useGenerateNowRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import {
  RecurringInvoice,
  RecurringInvoiceStatus,
  RecurringFrequency,
  RecurringInvoiceTemplateData,
  RecurringInvoiceLog,
  InvoiceStatus,
} from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.WEEKLY]: 'Semanal',
  [RecurringFrequency.BIWEEKLY]: 'Quincenal',
  [RecurringFrequency.MONTHLY]: 'Mensual',
  [RecurringFrequency.QUARTERLY]: 'Trimestral',
  [RecurringFrequency.YEARLY]: 'Anual',
};

const STATUS_CONFIG: Record<RecurringInvoiceStatus, { label: string; className: string }> = {
  [RecurringInvoiceStatus.ACTIVE]: {
    label: 'Activa',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [RecurringInvoiceStatus.PAUSED]: {
    label: 'Pausada',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [RecurringInvoiceStatus.COMPLETED]: {
    label: 'Completada',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [RecurringInvoiceStatus.CANCELLED]: {
    label: 'Cancelada',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

const INVOICE_STATUS_LABELS: Partial<Record<InvoiceStatus, string>> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.CONFIRMED]: 'Confirmada',
  [InvoiceStatus.SENT]: 'Enviada',
  [InvoiceStatus.PAID]: 'Cobrada',
  [InvoiceStatus.PROFORMA]: 'Proforma',
};

// ==================== HELPERS ====================

function formatDate(dateStr: string | null | undefined, timeZone = 'UTC'): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

/**
 * UX-01: Paused invoices show "Pausada" instead of past nextRunDate.
 */
function getNextRunLabel(recurring: RecurringInvoice): string {
  if (recurring.status === RecurringInvoiceStatus.PAUSED) return 'Pausada';
  if (recurring.status === RecurringInvoiceStatus.COMPLETED) return 'Completada';
  if (recurring.status === RecurringInvoiceStatus.CANCELLED) return 'Cancelada';
  return formatDate(recurring.nextRunDate);
}

// ==================== MANUAL NEXT-RUN DATE EDITOR ====================

interface NextRunDateEditorProps {
  recurringId: string;
  currentDate: string;
  status: RecurringInvoiceStatus;
}

function NextRunDateEditor({ recurringId, currentDate, status }: NextRunDateEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentDate.split('T')[0]);
  const update = useUpdateRecurringInvoice(recurringId);

  const canEdit =
    status === RecurringInvoiceStatus.ACTIVE || status === RecurringInvoiceStatus.PAUSED;

  if (!canEdit) return <span>{formatDate(currentDate)}</span>;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 text-sm w-44"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={update.isPending}
          onClick={async () => {
            await update.mutateAsync({ nextRunDate: value });
            setIsEditing(false);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            setValue(currentDate.split('T')[0]);
            setIsEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{getNextRunLabel({ nextRunDate: currentDate, status } as RecurringInvoice)}</span>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          title="Editar próxima fecha"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ==================== PAGE ====================

export default function RecurrenteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: recurring, isLoading, error } = useRecurringInvoice(id);
  const deleteMutation = useDeleteRecurringInvoice();
  const pauseMutation = usePauseRecurringInvoice();
  const resumeMutation = useResumeRecurringInvoice();
  const skipMutation = useSkipNextRecurringInvoice();
  const generateNowMutation = useGenerateNowRecurringInvoice();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !recurring) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 text-destructive">
        Factura recurrente no encontrada
      </div>
    );
  }

  const isActive = recurring.status === RecurringInvoiceStatus.ACTIVE;
  const isPaused = recurring.status === RecurringInvoiceStatus.PAUSED;
  const isEditable = isActive || isPaused;

  const templateData = recurring.templateData as RecurringInvoiceTemplateData;
  const paymentDetails = templateData?.paymentDetails as Record<string, string> | undefined;

  async function handleDelete() {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/recurrentes');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/recurrentes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {recurring.description ?? recurring.customer?.name ?? 'Factura recurrente'}
              </h1>
              <Badge className={cn('text-xs', STATUS_CONFIG[recurring.status].className)}>
                {STATUS_CONFIG[recurring.status].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {FREQUENCY_LABELS[recurring.frequency]} · Día {recurring.dayOfMonth} de cada período
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap justify-end">
          {isActive && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={generateNowMutation.isPending}
                onClick={() => generateNowMutation.mutate(id)}
              >
                <Zap className="h-4 w-4 mr-1" />
                Generar ahora
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={skipMutation.isPending}
                onClick={() => skipMutation.mutate(id)}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Saltar siguiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate(id)}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            </>
          )}
          {isPaused && (
            <Button
              variant="outline"
              size="sm"
              disabled={resumeMutation.isPending}
              onClick={() => resumeMutation.mutate(id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Reanudar
            </Button>
          )}
          {isEditable && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/recurrentes/${id}/editar`}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Programación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frecuencia</span>
              <span className="font-medium">{FREQUENCY_LABELS[recurring.frequency]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Día del mes</span>
              <span className="font-medium">{recurring.dayOfMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicio</span>
              <span className="font-medium">{formatDate(recurring.startDate)}</span>
            </div>
            {recurring.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fin</span>
                <span className="font-medium">{formatDate(recurring.endDate)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Próxima generación</span>
              {/* MISSING-02: Manual nextRunDate editor */}
              <NextRunDateEditor
                recurringId={id}
                currentDate={recurring.nextRunDate}
                status={recurring.status}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última generación</span>
              <span className="font-medium">{formatDate(recurring.lastRunDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Facturas generadas</span>
              <span className="font-medium">
                {recurring.generatedCount}
                {recurring.maxOccurrences != null && ` / ${recurring.maxOccurrences}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Client & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Cliente y pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <Link
                href={`/dashboard/clientes/${recurring.customerId}`}
                className="font-medium text-primary hover:underline"
              >
                {recurring.customer?.name ?? '—'}
              </Link>
            </div>
            {recurring.customer?.nif && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIF</span>
                <span className="font-medium">{recurring.customer.nif}</span>
              </div>
            )}
            {templateData?.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago</span>
                <span className="font-medium">
                  {PAYMENT_METHOD_LABELS[templateData.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? templateData.paymentMethod}
                </span>
              </div>
            )}
            {/* UX-03: Show payment details (IBAN, BIC, etc.) */}
            {paymentDetails && Object.keys(paymentDetails).length > 0 && (
              <>
                {paymentDetails.iban && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-medium font-mono text-xs">{paymentDetails.iban}</span>
                  </div>
                )}
                {paymentDetails.bic && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BIC</span>
                    <span className="font-medium">{paymentDetails.bic}</span>
                  </div>
                )}
                {paymentDetails.accountHolder && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titular</span>
                    <span className="font-medium">{paymentDetails.accountHolder}</span>
                  </div>
                )}
                {paymentDetails.bizumPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bizum</span>
                    <span className="font-medium">{paymentDetails.bizumPhone}</span>
                  </div>
                )}
                {paymentDetails.paypalEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PayPal</span>
                    <span className="font-medium">{paymentDetails.paypalEmail}</span>
                  </div>
                )}
              </>
            )}
            {templateData?.dueDays != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento</span>
                <span className="font-medium">{templateData.dueDays} días</span>
              </div>
            )}
            {recurring.series && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serie</span>
                <span className="font-medium">{recurring.series.prefix}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lines */}
      {templateData?.lines?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Líneas de la factura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Cant.</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">P. unit.</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">IVA</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {templateData.lines.map((line, i) => (
                  <tr key={i} className="border-b last:border-0 py-2">
                    <td className="py-2">{line.description}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(line.unitPrice)}</td>
                    <td className="py-2 text-right">{line.taxRate}%</td>
                    <td className="py-2 text-right">
                      {formatCurrency(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {templateData.discountPercent != null && (
              <div className="mt-2 text-sm text-right text-muted-foreground">
                Descuento: {templateData.discountPercent}%
              </div>
            )}
            {templateData.irpfPercent != null && (
              <div className="text-sm text-right text-muted-foreground">
                IRPF: {templateData.irpfPercent}%
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MISSING-01: Generated invoices list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Facturas generadas ({recurring.generatedCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recurring.generatedInvoices || recurring.generatedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no se han generado facturas para esta recurrente
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Número</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {recurring.generatedInvoices.map((log: RecurringInvoiceLog) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-2">{log.invoice?.number ?? 'Borrador'}</td>
                    <td className="py-2">
                      {log.invoice?.issueDate
                        ? formatDate(log.invoice.issueDate, 'UTC')
                        : formatDate(log.generatedAt, 'UTC')}
                    </td>
                    <td className="py-2">
                      {log.invoice?.status
                        ? (INVOICE_STATUS_LABELS[log.invoice.status as InvoiceStatus] ?? log.invoice.status)
                        : '—'}
                    </td>
                    <td className="py-2 text-right">
                      {log.invoice?.total != null ? formatCurrency(Number(log.invoice.total)) : '—'}
                    </td>
                    <td className="py-2 text-right">
                      {log.invoice?.id && (
                        <Link
                          href={`/dashboard/facturas/${log.invoice.id}`}
                          className="text-primary hover:underline text-xs"
                        >
                          Ver factura →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la configuración recurrente. Las facturas ya generadas no se verán
              afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
