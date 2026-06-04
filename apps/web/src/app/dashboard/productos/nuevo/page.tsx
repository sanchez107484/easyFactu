'use client';

import { useState, useEffect } from 'react';
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
import {
  ArrowLeft,
  Package,
  Wrench,
  Euro,
  Tag,
  FileText,
  Hash,
  Ruler,
  Loader2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useCreateProduct } from '@/hooks/use-products';
import { ProductType } from '@easyfactura/shared-types';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';
import { round2, round4, formatUnitPrice, formatUnitPriceCurrency } from '@/lib/math';

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

const TYPE_OPTIONS = [
  {
    value: ProductType.SERVICE,
    icon: Wrench,
    label: 'Servicio',
    description: 'Consultoría, diseño, desarrollo, asesoría...',
    tip: 'Ideal para facturar por horas o proyectos',
  },
  {
    value: ProductType.PRODUCT,
    icon: Package,
    label: 'Producto',
    description: 'Artículo físico, material, mercancía...',
    tip: 'Ideal si vendes bienes tangibles',
  },
] as const;

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
  const taxAmount = round2(unitPrice * (taxRate / 100));
  const pvp = round2(unitPrice + taxAmount);
  const selectedType = form.watch('type');
  const watchedUnit = form.watch('unit') || '';

  // Local raw string state for the two bidirectional price inputs
  const [unitPriceRaw, setUnitPriceRaw] = useState<string>('');
  const [totalRaw, setTotalRaw] = useState<string>('');

  // When IVA type changes, re-sync totalRaw from the current unitPrice (source of truth)
  useEffect(() => {
    const v = form.getValues('unitPrice') || 0;
    if (v > 0) {
      setTotalRaw(
        round2(v * (1 + taxRate / 100)).toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxRate]);

  const UNIT_SUGGESTIONS =
    selectedType === ProductType.SERVICE
      ? ['Hora', 'Sesión', 'Día', 'Proyecto', 'Mes', 'Consulta']
      : ['Ud.', 'kg', 'm', 'm²', 'l', 'Caja', 'Pack'];

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
    <div className="pb-24 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/productos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedType === ProductType.SERVICE ? 'Nuevo servicio' : 'Nuevo producto'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Añade un elemento a tu catálogo para usarlo rápidamente en tus facturas
            </p>
          </div>
        </div>
        <Link href="/dashboard/importar/productos">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
        </Link>
      </div>

      <form id="product-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seccion 1: Tipo */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Tipo de elemento</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selecciona si es un servicio que prestas o un producto que vendes
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TYPE_OPTIONS.map(({ value, icon: Icon, label, description, tip }) => {
                    const active = selectedType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => form.setValue('type', value)}
                        disabled={createMutation.isPending}
                        className={cn(
                          'relative flex flex-col gap-2 rounded-xl border-2 p-5 text-left transition-all',
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-foreground/25 hover:bg-muted/40',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                'font-semibold text-sm',
                                active ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {label}
                            </p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tip}</p>
                        {active && (
                          <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Seccion 2: Informacion basica */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Información básica</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estos datos aparecerán en tus facturas
                </p>
              </div>
              <div className="p-6 space-y-5">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder={
                      selectedType === ProductType.SERVICE
                        ? 'Ej: Consultoría técnica mensual'
                        : 'Ej: Camiseta algodon talla M'
                    }
                    disabled={createMutation.isPending}
                    className="h-11 text-base"
                    autoFocus
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Descripcion */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Detalla en qué consiste este elemento. Este texto es el que el cliente verá en la factura."
                    rows={3}
                    disabled={createMutation.isPending}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este texto es el que aparecerá en la línea de la factura.
                  </p>
                </div>

                {/* Referencia + Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reference"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      Referencia / Código{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="reference"
                      {...form.register('reference')}
                      placeholder="Ej: SERV-001"
                      disabled={createMutation.isPending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      Unidad de medida{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {UNIT_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            form.setValue(
                              'unit',
                              s.toLowerCase() !== watchedUnit.toLowerCase() ? s : '',
                            )
                          }
                          disabled={createMutation.isPending}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full border transition-all',
                            watchedUnit.toLowerCase() === s.toLowerCase()
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background',
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <Input
                      id="unit"
                      {...form.register('unit')}
                      placeholder={
                        selectedType === ProductType.SERVICE
                          ? 'O escribe la unidad: hora, proyecto...'
                          : 'O escribe la unidad: ud., kg, caja...'
                      }
                      disabled={createMutation.isPending}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seccion 3: Precio */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Precio e impuestos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El precio que introduces es sin IVA. El IVA se suma al hacer la factura.
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Precio sin IVA — hasta 4 decimales, sincronizado con Precio con IVA */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="unitPrice"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      {watchedUnit ? `Precio por ${watchedUnit}` : 'Precio sin IVA'}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="unitPrice"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={unitPriceRaw}
                        className="h-11 pr-12 text-base"
                        disabled={createMutation.isPending}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setUnitPriceRaw(raw);
                          const num = parseFloat(raw.replace(',', '.'));
                          if (!isNaN(num) && num >= 0) {
                            form.setValue('unitPrice', num, { shouldValidate: false });
                            setTotalRaw(
                              round2(num * (1 + taxRate / 100)).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }),
                            );
                          }
                        }}
                        onBlur={() => {
                          const num = parseFloat(unitPriceRaw.replace(',', '.'));
                          if (isNaN(num) || num < 0) {
                            setUnitPriceRaw('');
                            setTotalRaw('');
                            form.setValue('unitPrice', 0, { shouldValidate: true });
                          } else {
                            setUnitPriceRaw(formatUnitPrice(num));
                            form.setValue('unitPrice', num, { shouldValidate: true });
                            setTotalRaw(
                              round2(num * (1 + taxRate / 100)).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }),
                            );
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        EUR
                      </span>
                    </div>
                    {form.formState.errors.unitPrice && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.unitPrice.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-sm font-medium">
                      Tipo de IVA <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(form.watch('taxRate') ?? 21)}
                      onValueChange={(v) => form.setValue('taxRate', parseFloat(v))}
                      disabled={createMutation.isPending}
                    >
                      <SelectTrigger id="taxRate" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATE_SELECT_OPTIONS.map((t) => (
                          <SelectItem key={String(t.value)} value={String(t.value)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      La mayoría de autónomos usan el 21%
                    </p>
                  </div>

                  {/* Precio con IVA — autocalculado pero también editable (back-calcula sin IVA) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="totalPrice"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      Precio con IVA
                    </Label>
                    <div className="relative">
                      <Input
                        id="totalPrice"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={totalRaw}
                        className="h-11 pr-12 text-base"
                        disabled={createMutation.isPending}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setTotalRaw(raw);
                          const total = parseFloat(raw.replace(',', '.'));
                          if (!isNaN(total) && total >= 0) {
                            const divisor = 1 + taxRate / 100;
                            const unitP = divisor > 0 ? round4(total / divisor) : 0;
                            form.setValue('unitPrice', unitP, { shouldValidate: false });
                            setUnitPriceRaw(formatUnitPrice(unitP));
                          }
                        }}
                        onBlur={() => {
                          const total = parseFloat(totalRaw.replace(',', '.'));
                          if (isNaN(total) || total < 0) {
                            setTotalRaw('');
                            setUnitPriceRaw('');
                            form.setValue('unitPrice', 0, { shouldValidate: true });
                          } else {
                            setTotalRaw(
                              round2(total).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }),
                            );
                            const divisor = 1 + taxRate / 100;
                            const unitP = divisor > 0 ? round4(total / divisor) : 0;
                            form.setValue('unitPrice', unitP, { shouldValidate: true });
                            setUnitPriceRaw(formatUnitPrice(unitP));
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        EUR
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se autocalcula, pero puedes introducirlo directamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden lg:sticky lg:top-4">
              <div className="px-5 py-4 border-b bg-muted/30">
                <p className="text-sm font-semibold">Resumen del precio</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cálculo en tiempo real</p>
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-medium tabular-nums">
                    {formatUnitPriceCurrency(unitPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                  <span className="font-medium tabular-nums text-muted-foreground">
                    +{taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-3 mt-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Total al cliente</p>
                  <p className="text-3xl font-extrabold tabular-nums text-primary leading-none">
                    {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">IVA incluido</p>
                </div>
              </div>
              <div className="px-5 pb-5 space-y-2 border-t pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-11 font-semibold"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : selectedType === ProductType.SERVICE ? (
                    'Guardar servicio'
                  ) : (
                    'Guardar producto'
                  )}
                </Button>
                <Link href="/dashboard/productos" className="block">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-xs leading-relaxed">
              <p className="font-semibold text-foreground mb-1.5">¿Para qué sirve el catálogo?</p>
              <p className="text-muted-foreground">
                Guarda aquí tus servicios y productos habituales. La próxima vez que hagas una
                factura, podrás añadirlos con un solo clic sin tener que escribir nada a mano.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky bottom action bar — only visible below lg where sidebar is below the fold */}
      <div className="fixed bottom-0 inset-x-0 z-20 flex items-center justify-between gap-3 border-t bg-background/95 backdrop-blur px-4 py-3 lg:hidden">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total al cliente</p>
          <p className="text-lg font-bold tabular-nums text-primary leading-tight">
            {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/productos">
            <Button type="button" variant="outline" size="sm" disabled={createMutation.isPending}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            form="product-form"
            disabled={createMutation.isPending}
            className="font-semibold"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : selectedType === ProductType.SERVICE ? (
              'Guardar servicio'
            ) : (
              'Guardar producto'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
