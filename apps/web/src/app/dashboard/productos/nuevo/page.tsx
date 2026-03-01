'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Package, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCreateProduct } from '@/hooks/use-products';
import { ProductType } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().optional(),
  reference: z.string().optional(),
  unit: z.string().optional(),
  type: z.nativeEnum(ProductType),
  unitPrice: z
    .number({ invalid_type_error: 'Introduce un precio válido' })
    .min(0, 'El precio no puede ser negativo'),
  taxRate: z.number().min(0).max(100),
});

type ProductFormData = z.infer<typeof productSchema>;

const TAX_RATES = [
  { value: '0', label: '0% — Exento' },
  { value: '4', label: '4% — Superreducido' },
  { value: '10', label: '10% — Reducido' },
  { value: '21', label: '21% — General' },
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: ProductType.SERVICE,
      unitPrice: 0,
      taxRate: 21,
    },
  });

  const unitPrice = form.watch('unitPrice') || 0;
  const taxRate = form.watch('taxRate') || 0;
  const taxAmount = unitPrice * (taxRate / 100);
  const pvp = unitPrice + taxAmount;

  const createMutation = useCreateProduct();

  const onSubmit = async (data: ProductFormData) => {
    await createMutation.mutateAsync({
      ...data,
      description: data.description || undefined,
      reference: data.reference || undefined,
      unit: data.unit || undefined,
    });
    router.push('/dashboard/productos');
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dashboard/productos">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nuevo producto / servicio</h1>
          <p className="text-xs text-muted-foreground">Añade un elemento a tu catálogo</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-4">
          {/* ── Main form — single card ── */}
          <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm p-5 space-y-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">¿Qué vas a añadir?</Label>
              <div className="grid grid-cols-2 gap-2">
                {([ProductType.SERVICE, ProductType.PRODUCT] as const).map((t) => {
                  const active = form.watch('type') === t;
                  const Icon = t === ProductType.SERVICE ? Wrench : Package;
                  const label = t === ProductType.SERVICE ? 'Servicio' : 'Producto';
                  const sub =
                    t === ProductType.SERVICE
                      ? 'Consultoría, diseño, desarrollo…'
                      : 'Artículo o bien físico';
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => form.setValue('type', t)}
                      disabled={createMutation.isPending}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all',
                        active
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs font-normal opacity-70">{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Ej: Consultoría técnica por hora"
                disabled={createMutation.isPending}
                className="h-10"
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">
                Descripción{' '}
                <span className="text-muted-foreground font-normal">
                  (opcional — aparecerá en la factura)
                </span>
              </Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Detalla en qué consiste…"
                rows={2}
                disabled={createMutation.isPending}
                className="resize-none"
              />
            </div>

            {/* Referencia + Unidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reference" className="text-sm">
                  Referencia / Código{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="reference"
                  {...form.register('reference')}
                  placeholder="Ej: CONS-001"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-sm">
                  Unidad de medida{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="unit"
                  {...form.register('unit')}
                  placeholder="hora, ud., kg…"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            {/* Precio + IVA */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice" className="text-sm font-semibold">
                  Precio sin IVA <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('unitPrice', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="pr-8 h-10"
                    disabled={createMutation.isPending}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                <Label htmlFor="taxRate" className="text-sm font-semibold">
                  IVA <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(form.watch('taxRate') ?? 21)}
                  onValueChange={(v) => form.setValue('taxRate', parseFloat(v))}
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger id="taxRate" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_RATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-4">
            {/* Price preview */}
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <p className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Vista previa del precio
              </p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-medium tabular-nums">
                    {unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                  <span className="font-medium tabular-nums">
                    {taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="border-t pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold">Total al cliente</span>
                  <span className="text-2xl font-extrabold tabular-nums text-primary">
                    {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Consejo:</strong> Guarda tus productos y servicios habituales aquí para
              añadirlos rápidamente a tus facturas con un solo clic.
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full h-11 text-base font-semibold"
              >
                {createMutation.isPending ? 'Guardando…' : '✓ Guardar en el catálogo'}
              </Button>
              <Link href="/dashboard/productos" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
