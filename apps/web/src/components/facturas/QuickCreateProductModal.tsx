'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductType } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Package, Wrench, Zap } from 'lucide-react';
import { useCreateProduct } from '@/hooks/use-products';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';

// ==================== SCHEMA ====================

const quickProductSchema = z.object({
  type: z.nativeEnum(ProductType),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(500).optional(),
  unitPrice: z
    .number({ invalid_type_error: 'Introduce un precio válido' })
    .min(0, 'El precio no puede ser negativo'),
  taxRate: z.number().min(0).max(100),
  unit: z.string().max(20).optional(),
});

type QuickProductFormData = z.infer<typeof quickProductSchema>;

// ==================== TYPES ====================

export interface QuickCreateProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Llamado con el producto recién creado para aplicarlo a la línea activa */
  onProductReady: (product: Product) => void;
  /** Pre-selecciona el tipo según el modo de la línea activa */
  defaultType?: ProductType;
}

// ==================== UNIT SUGGESTIONS ====================

const UNIT_SUGGESTIONS: Record<ProductType, string[]> = {
  [ProductType.SERVICE]: ['Hora', 'Sesión', 'Día', 'Proyecto', 'Mes', 'Consulta'],
  [ProductType.PRODUCT]: ['Ud.', 'kg', 'm', 'm²', 'l', 'Caja', 'Pack'],
};

// ==================== MODAL ====================

export function QuickCreateProductModal({
  open,
  onClose,
  onProductReady,
  defaultType = ProductType.SERVICE,
}: QuickCreateProductModalProps) {
  const createMutation = useCreateProduct();

  const form = useForm<QuickProductFormData>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      type: defaultType,
      unitPrice: 0,
      taxRate: 21,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ type: defaultType, unitPrice: 0, taxRate: 21 });
    }
  }, [open, defaultType, form]);

  const selectedType = form.watch('type');
  const isSubmitting = createMutation.isPending;

  const onSubmit = async (data: QuickProductFormData) => {
    const product = await createMutation.mutateAsync({
      type: data.type,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      unitPrice: data.unitPrice,
      taxRate: data.taxRate,
      unit: data.unit?.trim() || undefined,
    });
    onProductReady(product);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar en el catálogo</DialogTitle>
          <DialogDescription>
            Añade este elemento a tu catálogo y úsalo en todas tus facturas con un clic.
          </DialogDescription>
        </DialogHeader>

        {/* ── Informative banner ── */}
        <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
          <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Los elementos del catálogo te permiten rellenar líneas en un clic, mantener precios e
            IVA siempre consistentes y ahorrar tiempo en cada nueva factura.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }}
          noValidate
          className="space-y-4"
        >
          {/* ── Type selector ── */}
          <div className="grid grid-cols-2 gap-2">
            {([ProductType.SERVICE, ProductType.PRODUCT] as const).map((t) => {
              const Icon = t === ProductType.SERVICE ? Wrench : Package;
              const active = selectedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => form.setValue('type', t)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-foreground/25',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'text-xs font-semibold leading-tight',
                        active ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {t === ProductType.SERVICE ? 'Servicio' : 'Producto'}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {t === ProductType.SERVICE
                        ? 'Consultoría, diseño, desarrollo...'
                        : 'Artículo físico, material...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Name ── */}
          <div className="space-y-1.5">
            <Label htmlFor="qp-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="qp-name"
              {...form.register('name')}
              placeholder={
                selectedType === ProductType.SERVICE
                  ? 'Ej: Consultoría técnica hora'
                  : 'Ej: Camiseta algodón talla M'
              }
              autoFocus
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* ── Description ── */}
          <div className="space-y-1.5">
            <Label htmlFor="qp-description">Descripción</Label>
            <Textarea
              id="qp-description"
              {...form.register('description')}
              placeholder="Detalla en qué consiste. Este texto es el que aparecerá en la línea de la factura..."
              rows={2}
              className="resize-none text-sm"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Este texto es el que verá el cliente en la factura.
            </p>
          </div>

          {/* ── Price + Tax ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qp-price">
                Precio neto <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="qp-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pr-7"
                  {...form.register('unitPrice', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                  €
                </span>
              </div>
              {form.formState.errors.unitPrice && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.unitPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qp-tax">
                IVA <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(form.watch('taxRate') ?? 21)}
                onValueChange={(v) => form.setValue('taxRate', parseFloat(v))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="qp-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_RATE_SELECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Unit — optional with quick suggestions ── */}
          <div className="space-y-1.5">
            <Label htmlFor="qp-unit" className="flex items-center gap-1">
              Unidad
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="qp-unit"
              {...form.register('unit')}
              placeholder={
                selectedType === ProductType.SERVICE ? 'Hora, Sesión, Proyecto...' : 'Ud., kg, m...'
              }
              disabled={isSubmitting}
            />
            {/* Quick-pick suggestions */}
            <div className="flex flex-wrap gap-1 mt-1">
              {UNIT_SUGGESTIONS[selectedType].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => form.setValue('unit', suggestion)}
                  disabled={isSubmitting}
                  className="px-2 py-0.5 rounded-full text-[11px] border border-border bg-muted/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar y aplicar a la línea'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
