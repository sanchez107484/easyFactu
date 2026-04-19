'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Loader2,
  LayoutTemplate,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
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
  useInvoiceSeries,
  useCreateSeries,
  useUpdateSeries,
  useDeleteSeries,
} from '@/hooks/use-invoice-series';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { InvoiceSeries, SeriesType } from '@easyfactura/shared-types';
import {
  InvoiceSeriesFormFields,
  invoiceSeriesEditSchema,
  InvoiceSeriesEditValues,
} from '@/components/invoice-series/invoice-series-form-fields';
import {
  PrefixYearWarningDialog,
  prefixContainsYear,
} from '@/components/invoice-series/prefix-year-warning-dialog';

// ==================== SCHEMA ====================

const seriesSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  type: z.nativeEnum(SeriesType),
  prefix: z.string().min(1, 'El prefijo es obligatorio').max(20, 'Máximo 20 caracteres'),
  isDefault: z.boolean().optional(),
  nextNumber: z
    .number()
    .int()
    .min(1, 'El número inicial debe ser al menos 1')
    .optional()
    .or(z.nan().transform(() => undefined)),
});

type SeriesFormData = z.infer<typeof seriesSchema>;

// ==================== SERIES CREATE CONFIRM DIALOG ====================

interface SeriesCreateConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: SeriesFormData;
  year: number;
  isPending: boolean;
}

function SeriesCreateConfirmDialog({
  open,
  onClose,
  onConfirm,
  data,
  year,
  isPending,
}: SeriesCreateConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const startAt = data.nextNumber && !isNaN(data.nextNumber) ? data.nextNumber : 1;
  const previewNumber = `${data.prefix}${String(startAt).padStart(4, '0')}`;
  const hasYearWarning = !prefixContainsYear(data.prefix, year);

  const typeLabels: Record<string, string> = {
    [SeriesType.INVOICE]: 'Factura',
    [SeriesType.RECTIFICATIVE]: 'Rectificativa',
    [SeriesType.QUOTE]: 'Presupuesto',
  };

  function handleOpenChange(value: boolean) {
    if (!value) {
      setAcknowledged(false);
      onClose();
    }
  }

  function handleConfirm() {
    setAcknowledged(false);
    onConfirm();
  }

  const canConfirm = !hasYearWarning || acknowledged;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar nueva serie</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Revisa la configuración antes de crear la serie.
              </p>
              <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span>{typeLabels[data.type] ?? data.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre</span>
                  <span>{data.name}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-1">
                  <span className="text-muted-foreground">Primera factura</span>
                  <span className="font-mono font-semibold text-base">{previewNumber}</span>
                </div>
              </div>
              {hasYearWarning && (
                <>
                  <div className="flex gap-2 rounded-md border border-proforma-200 bg-proforma-50 p-3 text-proforma-800 dark:border-proforma-800 dark:bg-proforma-950 dark:text-proforma-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      El prefijo no contiene el año {year}. Las facturas no llevarán referencia al
                      año en el número.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3">
                    <Checkbox
                      id="series-confirm-ack"
                      checked={acknowledged}
                      onCheckedChange={(checked) => setAcknowledged(checked === true)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="series-confirm-ack"
                      className="text-sm font-normal leading-snug cursor-pointer"
                    >
                      Entiendo que las facturas de esta serie no llevarán el año en el número
                    </Label>
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || !canConfirm}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear serie
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== CREATE SERIES DIALOG ====================

interface CreateSeriesDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateSeriesDialog({ open, onClose }: CreateSeriesDialogProps) {
  const createSeries = useCreateSeries();
  const currentYear = new Date().getFullYear();
  const [pendingData, setPendingData] = useState<SeriesFormData | null>(null);

  const form = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      name: '',
      type: SeriesType.INVOICE,
      prefix: '',
      isDefault: false,
      nextNumber: undefined,
    },
  });

  function submitData(data: SeriesFormData) {
    const code =
      data.prefix
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase()
        .slice(0, 10) || 'SERIE';
    createSeries.mutate(
      { ...data, code, year: currentYear },
      {
        onSuccess: () => {
          form.reset();
          setPendingData(null);
          onClose();
        },
      },
    );
  }

  function onSubmit(data: SeriesFormData) {
    setPendingData(data);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva serie de facturación</DialogTitle>
            <DialogDescription>
              Crea una serie de numeración para tus facturas del año {currentYear}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as SeriesType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SeriesType.INVOICE}>Factura</SelectItem>
                  <SelectItem value={SeriesType.RECTIFICATIVE}>Rectificativa</SelectItem>
                  <SelectItem value={SeriesType.QUOTE}>Presupuesto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nombre descriptivo *</Label>
              <Input id="name" placeholder="Facturas generales" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="prefix">Prefijo de numeración *</Label>
              <Input id="prefix" placeholder="F-" {...form.register('prefix')} />
              {form.watch('prefix') ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ej:{' '}
                  <span className="font-mono">
                    {formatSeriesPreview(form.watch('prefix'), currentYear, 1)}
                  </span>
                  ,{' '}
                  <span className="font-mono">
                    {formatSeriesPreview(form.watch('prefix'), currentYear, 2)}
                  </span>
                  ...
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Escribe un prefijo para ver cómo quedarán las facturas
                </p>
              )}
              {form.formState.errors.prefix && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.prefix.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nextNumber">Número inicial</Label>
              <Input
                id="nextNumber"
                type="number"
                min={1}
                placeholder="1"
                {...form.register('nextNumber', { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Útil si ya has emitido facturas este año y quieres continuar desde ese número
              </p>
              {form.formState.errors.nextNumber && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.nextNumber.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isDefault"
                checked={form.watch('isDefault') ?? false}
                onCheckedChange={(v) => form.setValue('isDefault', v)}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Usar como serie por defecto
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSeries.isPending} className="gap-2">
                {createSeries.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear serie
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {pendingData && (
        <SeriesCreateConfirmDialog
          open
          onClose={() => setPendingData(null)}
          onConfirm={() => submitData(pendingData)}
          data={pendingData}
          year={currentYear}
          isPending={createSeries.isPending}
        />
      )}
    </>
  );
}

// ==================== EDIT SERIES DIALOG ====================

interface EditSeriesDialogProps {
  series: InvoiceSeries | null;
  onClose: () => void;
}

function EditSeriesDialog({ series, onClose }: EditSeriesDialogProps) {
  const updateSeries = useUpdateSeries();
  const [pendingData, setPendingData] = useState<InvoiceSeriesEditValues | null>(null);
  const seriesYear = series?.year ?? new Date().getFullYear();

  const form = useForm<InvoiceSeriesEditValues>({
    resolver: zodResolver(invoiceSeriesEditSchema),
    values: series
      ? {
          name: series.name,
          prefix: series.prefix,
          isDefault: series.isDefault,
          nextNumber: undefined,
        }
      : { name: '', prefix: '', isDefault: false, nextNumber: undefined },
  });

  function performUpdate(data: InvoiceSeriesEditValues) {
    if (!series) return;
    updateSeries.mutate({ id: series.id, data }, { onSuccess: onClose });
  }

  function onSubmit(data: InvoiceSeriesEditValues) {
    if (!series) return;
    if (!prefixContainsYear(data.prefix, seriesYear)) {
      setPendingData(data);
      return;
    }
    performUpdate(data);
  }

  return (
    <>
      <Dialog open={Boolean(series)} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar serie — {series?.code}</DialogTitle>
            <DialogDescription>
              Modifica el nombre, prefijo o si es la serie por defecto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InvoiceSeriesFormFields form={form} year={seriesYear} showIsDefault showNextNumber />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateSeries.isPending} className="gap-2">
                {updateSeries.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PrefixYearWarningDialog
        open={pendingData !== null}
        onClose={() => setPendingData(null)}
        onConfirm={() => pendingData && performUpdate(pendingData)}
        prefix={pendingData?.prefix ?? ''}
        year={seriesYear}
        confirmLabel="Sí, guardar sin año"
        isPending={updateSeries.isPending}
      />
    </>
  );
}

// ==================== MAIN PAGE ====================

export default function AjustesFacturacionPage() {
  const currentYear = new Date().getFullYear();
  const { data: seriesData, isLoading } = useInvoiceSeries(currentYear);
  const deleteSeries = useDeleteSeries();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<InvoiceSeries | null>(null);
  const [deletingSeries, setDeletingSeries] = useState<InvoiceSeries | null>(null);

  const series = seriesData?.data ?? [];

  const typeLabel = (type: SeriesType) => {
    if (type === SeriesType.INVOICE) return 'Factura';
    if (type === SeriesType.RECTIFICATIVE) return 'Rectificativa';
    return 'Presupuesto';
  };

  return (
    <div className="space-y-6">
      {/* Series de Facturación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Series de Facturación
          </CardTitle>
          <CardDescription>
            Define las series de numeración para tus facturas. Cada año tiene sus propias series.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Año {currentYear}</p>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva serie
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : series.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No hay series para {currentYear}</p>
              <p className="text-sm text-muted-foreground">Crea tu primera serie de facturación</p>
              <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Crear serie
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Último nº</TableHead>
                  <TableHead>Siguiente factura</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((serie) => (
                  <TableRow key={serie.id}>
                    <TableCell className="font-mono font-medium">{serie.code}</TableCell>
                    <TableCell>{serie.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel(serie.type)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {serie.prefix}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {serie.nextNumber > 1 ? serie.nextNumber - 1 : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatSeriesPreview(serie.prefix, serie.year, serie.nextNumber)}
                    </TableCell>
                    <TableCell>
                      {serie.isDefault ? (
                        <Badge variant="default">Por defecto</Badge>
                      ) : (
                        <Badge variant="secondary">Activa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => setEditingSeries(serie)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={() => setDeletingSeries(serie)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enlace a Plantilla PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Plantilla de Factura
          </CardTitle>
          <CardDescription>
            Personaliza el diseño, colores y estructura de tus facturas PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Diseño y presentación</p>
              <p className="text-sm text-muted-foreground">
                Configura colores, tipografía, márgenes y qué información mostrar en cada sección
              </p>
            </div>
            <Button variant="outline" asChild className="gap-2 shrink-0">
              <Link href="/dashboard/ajustes/plantilla">
                <ExternalLink className="h-4 w-4" />
                Configurar plantilla
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateSeriesDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditSeriesDialog series={editingSeries} onClose={() => setEditingSeries(null)} />

      <AlertDialog
        open={Boolean(deletingSeries)}
        onOpenChange={(open) => !open && setDeletingSeries(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar serie {deletingSeries?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la serie <strong>{deletingSeries?.name}</strong> permanentemente. Esta
              acción no se puede deshacer. Solo es posible si no tiene facturas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingSeries) return;
                deleteSeries.mutate(deletingSeries.id, {
                  onSuccess: () => setDeletingSeries(null),
                });
              }}
            >
              {deleteSeries.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar serie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
