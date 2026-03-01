'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Package, Wrench, Euro, Tag, FileText, Hash, Ruler, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-products';
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
  { value: '0', label: '0% — Exento / No sujeto' },
  { value: '4', label: '4% — Superreducido' },
  { value: '10', label: '10% — Reducido' },
  { value: '21', label: '21% — General' },
];

const TYPE_OPTIONS = [
  {
    value: ProductType.SERVICE,
    icon: Wrench,
    label: 'Servicio',
    description: 'Consultoría, diseño, desarrollo, asesoría…',
    tip: 'Ideal para facturar por horas o proyectos',
  },
  {
    value: ProductType.PRODUCT,
    icon: Package,
    label: 'Producto',
    description: 'Artículo físico, material, mercancía…',
    tip: 'Ideal si vendes bienes tangibles',
  },
] as const;

function FormSkeleton() {
  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, error } = useProduct(id);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { type: ProductType.SERVICE, unitPrice: 0, taxRate: 21 },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description ?? '',
        reference: product.reference ?? '',
        unit: product.unit ?? '',
        type: (product.type as ProductType) ?? ProductType.SERVICE,
        unitPrice: Number(product.unitPrice) || 0,
        taxRate: Number(product.taxRate) || 21,
      });
    }
  }, [product, form]);

  const unitPrice = form.watch('unitPrice') || 0;
  const taxRate = form.watch('taxRate') || 0;
  const taxAmount = unitPrice * (taxRate / 100);
  const pvp = unitPrice + taxAmount;
  const selectedType = form.watch('type');

  const onSubmit = async (data: ProductFormData) => {
    await updateMutation.mutateAsync({
      id,
      ...data,
      description: data.description || undefined,
      reference: data.reference || undefined,
      unit: data.unit || undefined,
    });
    router.push('/dashboard/productos');
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/productos');
  };

  if (isLoading) return <FormSkeleton />;

  if (error || !product) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/productos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar producto</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">No se pudo cargar el producto</p>
          <p className="text-sm text-muted-foreground">
            Puede que haya sido eliminado o que no tengas permisos para editarlo.
          </p>
          <Link href="/dashboard/productos">
            <Button variant="outline" className="mt-2">Volver al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/productos/${id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar producto / servicio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Modificando: <span className="font-medium text-foreground">{product.name}</span>
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará <strong>{product.name}</strong> de tu catálogo. Esta acción no se puede
                deshacer. Las facturas ya creadas no se verán afectadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sección 1: Tipo */}
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
                        disabled={updateMutation.isPending}
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
                            <p className={cn('font-semibold text-sm', active ? 'text-primary' : 'text-foreground')}>
                              {label}
                            </p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground pl-[52px]">{tip}</p>
                        {active && <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sección 2: Información básica */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Información básica</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estos datos aparecerán en tus facturas
                </p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder={selectedType === ProductType.SERVICE ? 'Ej: Consultoría técnica mensual' : 'Ej: Camiseta algodón talla M'}
                    disabled={updateMutation.isPending}
                    className="h-11 text-base"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Descripción{' '}
                    <span className="text-xs text-muted-foreground font-normal">(opcional — aparecerá en la factura)</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Detalla en qué consiste este elemento."
                    rows={3}
                    disabled={updateMutation.isPending}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-sm font-medium flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      Referencia / Código{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input id="reference" {...form.register('reference')} placeholder="Ej: SERV-001" disabled={updateMutation.isPending} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      Unidad de medida{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="unit"
                      {...form.register('unit')}
                      placeholder={selectedType === ProductType.SERVICE ? 'hora, proyecto, mes…' : 'ud., kg, caja…'}
                      disabled={updateMutation.isPending}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3: Precio */}
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
                    <Label htmlFor="unitPrice" className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      Precio sin IVA <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('unitPrice', { valueAsNumber: true })}
                        placeholder="0,00"
                        className="h-11 pr-12 text-base"
                        disabled={updateMutation.isPending}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        EUR
                      </span>
                    </div>
                    {form.formState.errors.unitPrice && (
                      <p className="text-xs text-destructive">{form.formState.errors.unitPrice.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-sm font-medium">
                      Tipo de IVA <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(form.watch('taxRate') ?? 21)}
                      onValueChange={(v) => form.setValue('taxRate', parseFloat(v))}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger id="taxRate" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">La mayoría de autónomos usan el 21%</p>
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
                <p className="text-xs text-muted-foreground mt-0.5">Cálculo en tiempo real</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Precio final con todos los impuestos</p>
                </div>
              </div>
              <div className="px-5 pb-5 space-y-2 border-t pt-4">
                <Button type="submit" disabled={updateMutation.isPending} className="w-full h-11 font-semibold">
                  {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
                <Link href={`/dashboard/productos/${id}`} className="block">
                  <Button type="button" variant="ghost" disabled={updateMutation.isPending} className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 px-4 py-4 text-xs leading-relaxed">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1.5">¿Qué pasa si cambio el precio?</p>
              <p className="text-blue-700 dark:text-blue-400">
                Los cambios solo afectan a las facturas nuevas. Las facturas ya creadas no se modifican.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}