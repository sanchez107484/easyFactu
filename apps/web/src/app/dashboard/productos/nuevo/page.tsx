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
import { ArrowLeft, Package, Wrench, Euro, Tag, FileText, Hash, Ruler } from 'lucide-react';
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
    .number({ invalid_type_error: 'Introduce un precio valido' })
    .min(0, 'El precio no puede ser negativo'),
  taxRate: z.number().min(0).max(100),
});

type ProductFormData = z.infer<typeof productSchema>;

const TAX_RATES = [
  { value: '0', label: '0% - Exento / No sujeto' },
  { value: '4', label: '4% - Superreducido' },
  { value: '10', label: '10% - Reducido' },
  { value: '21', label: '21% - General' },
];

const TYPE_OPTIONS = [
  {
    value: ProductType.SERVICE,
    icon: Wrench,
    label: 'Servicio',
    description: 'Consultoria, diseno, desarrollo, asesoria...',
    tip: 'Ideal para facturar por horas o proyectos',
  },
  {
    value: ProductType.PRODUCT,
    icon: Package,
    label: 'Producto',
    description: 'Articulo fisico, material, mercancia...',
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
  const taxAmount = unitPrice * (taxRate / 100);
  const pvp = unitPrice + taxAmount;
  const selectedType = form.watch('type');
  const watchedUnit = form.watch('unit') || '';

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
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/productos">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo producto / servicio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Anade un elemento a tu catalogo para usarlo rapidamente en tus facturas
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                        <p className="text-xs text-muted-foreground pl-[52px]">{tip}</p>
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
                <h2 className="text-sm font-semibold">Informacion basica</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estos datos apareceran en tus facturas
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
                        ? 'Ej: Consultoria tecnica mensual'
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
                    Descripcion{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      (opcional - aparecer en la factura)
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Detalla en que consiste este elemento. Este texto aparecer en la factura."
                    rows={3}
                    disabled={createMutation.isPending}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Referencia + Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reference"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      Referencia / Codigo{' '}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('unitPrice', { valueAsNumber: true })}
                        placeholder="0,00"
                        className="h-11 pr-9 text-base"
                        disabled={createMutation.isPending}
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
                        {TAX_RATES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      La mayoria de autonomos usan el 21%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b bg-muted/30">
                <p className="text-sm font-semibold">Resumen del precio</p>
                <p className="text-xs text-muted-foreground mt-0.5">Calculo en tiempo real</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-medium tabular-nums">
                    {unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                  <span className="font-medium tabular-nums text-muted-foreground">
                    +{taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm">Total al cliente</span>
                    <span className="text-2xl font-extrabold tabular-nums text-primary">
                      {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Precio final con todos los impuestos
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 space-y-2 border-t pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-11 font-semibold"
                >
                  {createMutation.isPending ? 'Guardando...' : 'Guardar en el catalogo'}
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

            <div className="rounded-xl border border-dashed bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 px-4 py-4 text-xs leading-relaxed">
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1.5">
                Para que sirve el catalogo
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                Guarda aqui tus servicios y productos habituales. La proxima vez que hagas una
                factura, podras anadirlos con un solo clic sin tener que escribir nada a mano.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
