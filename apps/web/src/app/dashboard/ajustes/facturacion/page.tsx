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
import { Plus, Edit, FileText, Loader2, LayoutTemplate, ExternalLink } from 'lucide-react';
import { useInvoiceSeries, useCreateSeries, useUpdateSeries } from '@/hooks/use-invoice-series';
import { InvoiceSeries, SeriesType } from '@easyfactura/shared-types';

// ==================== SCHEMA ====================

const seriesSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es obligatorio')
    .max(10, 'Máximo 10 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Solo letras mayúsculas y números'),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  type: z.nativeEnum(SeriesType),
  prefix: z.string().min(1, 'El prefijo es obligatorio').max(20, 'Máximo 20 caracteres'),
  isDefault: z.boolean().optional(),
});

const editSeriesSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  prefix: z.string().min(1, 'El prefijo es obligatorio').max(20, 'Máximo 20 caracteres'),
  isDefault: z.boolean().optional(),
});

type SeriesFormData = z.infer<typeof seriesSchema>;
type EditSeriesFormData = z.infer<typeof editSeriesSchema>;

// ==================== CREATE SERIES DIALOG ====================

interface CreateSeriesDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateSeriesDialog({ open, onClose }: CreateSeriesDialogProps) {
  const createSeries = useCreateSeries();
  const currentYear = new Date().getFullYear();

  const form = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      code: '',
      name: '',
      type: SeriesType.INVOICE,
      prefix: '',
      isDefault: false,
    },
  });

  function onSubmit(data: SeriesFormData) {
    createSeries.mutate(
      { ...data, year: currentYear },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva serie de facturación</DialogTitle>
          <DialogDescription>
            Crea una serie de numeración para tus facturas del año {currentYear}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código *</Label>
              <Input id="code" placeholder="F" {...form.register('code')} />
              {form.formState.errors.code && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nombre descriptivo *</Label>
            <Input id="name" placeholder="Facturas generales" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="prefix">Prefijo de numeración *</Label>
            <Input id="prefix" placeholder={`${currentYear}/F-`} {...form.register('prefix')} />
            <p className="mt-1 text-xs text-muted-foreground">
              Ej: {currentYear}/F- → genera {currentYear}/F-0001, {currentYear}/F-0002...
            </p>
            {form.formState.errors.prefix && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.prefix.message}
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
  );
}

// ==================== EDIT SERIES DIALOG ====================

interface EditSeriesDialogProps {
  series: InvoiceSeries | null;
  onClose: () => void;
}

function EditSeriesDialog({ series, onClose }: EditSeriesDialogProps) {
  const updateSeries = useUpdateSeries();

  const form = useForm<EditSeriesFormData>({
    resolver: zodResolver(editSeriesSchema),
    values: series
      ? { name: series.name, prefix: series.prefix, isDefault: series.isDefault }
      : { name: '', prefix: '', isDefault: false },
  });

  function onSubmit(data: EditSeriesFormData) {
    if (!series) return;
    updateSeries.mutate({ id: series.id, data }, { onSuccess: onClose });
  }

  return (
    <Dialog open={Boolean(series)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar serie — {series?.code}</DialogTitle>
          <DialogDescription>
            Modifica el nombre, prefijo o si es la serie por defecto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nombre descriptivo *</Label>
            <Input id="edit-name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-prefix">Prefijo de numeración *</Label>
            <Input id="edit-prefix" {...form.register('prefix')} />
            {form.formState.errors.prefix && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.prefix.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="edit-isDefault"
              checked={form.watch('isDefault') ?? false}
              onCheckedChange={(v) => form.setValue('isDefault', v)}
            />
            <Label htmlFor="edit-isDefault" className="cursor-pointer">
              Usar como serie por defecto
            </Label>
          </div>

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
  );
}

// ==================== MAIN PAGE ====================

export default function AjustesFacturacionPage() {
  const currentYear = new Date().getFullYear();
  const { data: seriesData, isLoading } = useInvoiceSeries(currentYear);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<InvoiceSeries | null>(null);

  const series = seriesData?.data ?? [];

  const typeLabel = (type: SeriesType) =>
    type === SeriesType.INVOICE ? 'Factura' : 'Rectificativa';

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
                    <TableCell className="text-muted-foreground">{serie.lastNumber}</TableCell>
                    <TableCell>
                      {serie.isDefault ? (
                        <Badge variant="default">Por defecto</Badge>
                      ) : (
                        <Badge variant="secondary">Activa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => setEditingSeries(serie)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>
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
    </div>
  );
}
